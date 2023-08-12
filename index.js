import { createSchema, mergeSchemas } from 'genson-js';
import path from 'path';
import fs from 'fs';
const pfs = fs.promises;

// Set path to PA instllation folder:
const paPath = process.argv[2] || "W:/Games/SteamLibrary/steamapps/common/Planetary Annihilation Titans"
// Set output path:
const outputPath = "./specs"

const rootPath = path.join(paPath, '/media/pa_ex1');

const collectDirectory = async (dirPath, nameFunc, ext = '.json') => {
    const unitsPath = path.join(rootPath, dirPath)
    const unitsDir = await pfs.readdir(unitsPath);
    const allUnitFiles = [];
    await Promise.all(unitsDir.map(async (dirName) => {        
        const unitDir = await pfs.readdir(path.join(unitsPath, dirName));
        unitDir.forEach((fileName) => {
            if (path.extname(fileName) !== ext) return;
            if (nameFunc(dirName, fileName)) allUnitFiles.push(path.join(unitsPath, dirName, fileName))
        });
    }));

    const allData = await Promise.all(allUnitFiles.map(async (filePath) => {
        console.log(path.relative(rootPath, filePath));
        return pfs.readFile(filePath);
    }));

    return allData
        .filter(value => !!value)
        .map(JSON.parse);
};

const buildSchema = async (outputName, directories) => {
    const timeName = `Generated Schema '${outputName}'`;
    console.log(`>> Generating Schema '${outputName}'`)
    console.time(timeName);
    const all = await Promise.all(directories);

    const schemas = all.flat(1).map((data) => createSchema(data))
    await pfs.writeFile(path.join(outputPath, `${outputName}.json`), JSON.stringify(mergeSchemas(schemas), null, 2))
    console.timeEnd(timeName)
}

const main = async () => {
    console.time('Done');

    const allFunc = () => true;

    const unitSpecFileFunc =  (dir, file) => file === `${dir}.json`;
    await buildSchema('unit_spec', [
        collectDirectory('units/air', unitSpecFileFunc),
        collectDirectory('units/land', unitSpecFileFunc),
        collectDirectory('units/orbital', unitSpecFileFunc),
        collectDirectory('units/sea', unitSpecFileFunc)
    ]);

    const toolSpecFileFunc = (dir, file) => file.includes('tool') || file.includes('build_arm');
    await buildSchema('tool_spec', [
        collectDirectory('units/air', toolSpecFileFunc),
        collectDirectory('units/land', toolSpecFileFunc),
        collectDirectory('units/orbital', toolSpecFileFunc),
        collectDirectory('units/sea', toolSpecFileFunc),
        collectDirectory('tools', allFunc)
    ]);

    const ammoSpecFileFunc = (dir, file) => file.includes('ammo');
    await buildSchema('ammo_spec', [
        collectDirectory('units/air', ammoSpecFileFunc),
        collectDirectory('units/land', ammoSpecFileFunc),
        collectDirectory('units/orbital', ammoSpecFileFunc),
        collectDirectory('units/sea', ammoSpecFileFunc),
        collectDirectory('ammo', allFunc)
    ]);

    await buildSchema('pfx_spec', [
        collectDirectory('units/air', allFunc, '.pfx'),
        collectDirectory('units/land', allFunc, '.pfx'),
        collectDirectory('units/orbital', allFunc, '.pfx'),
        collectDirectory('units/sea', allFunc, '.pfx'),
        collectDirectory('effects', allFunc, '.pfx')
    ]);

    await buildSchema('anim_tree_spec', [
        collectDirectory('anim', (dir, file) => dir === 'anim_trees')
    ]);

    await buildSchema('ai_builds_spec', [
        collectDirectory('ai', (dir, file) => dir.includes('builds'))
    ]);

    console.timeEnd('Done');
}
main();
