import { createSchema, mergeSchemas } from 'genson-js';
import path from 'path';
import fs from 'fs';
const pfs = fs.promises;

// Set path to PA instllation folder:
const paPath = process.argv[2] || "C:/SteamLibrary/steamapps/common/Planetary Annihilation Titans"
// Set output path:
const outputPath = "./specs"

const rootPath = path.join(paPath, '/media');

const collectDirectory = async (dirPath, nameFunc, ext = '.json') => {
    const unitsPath = path.join(rootPath, dirPath)
    const unitsDir = await pfs.readdir(unitsPath);
    const allUnitFiles = [];
    await Promise.all(unitsDir.map(async (dirName) => {  
        const stat = await pfs.lstat(path.join(unitsPath, dirName));
        if(!stat.isDirectory()) return;
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
        collectDirectory('pa_ex1/units/air', unitSpecFileFunc),
        collectDirectory('pa_ex1/units/land', unitSpecFileFunc),
        collectDirectory('pa_ex1/units/orbital', unitSpecFileFunc),
        collectDirectory('pa_ex1/units/sea', unitSpecFileFunc),

        collectDirectory('pa/units/air', unitSpecFileFunc),
        collectDirectory('pa/units/land', unitSpecFileFunc),
        collectDirectory('pa/units/orbital', unitSpecFileFunc),
        collectDirectory('pa/units/sea', unitSpecFileFunc)
    ]);

    const toolSpecFileFunc = (dir, file) => file.includes('tool') || file.includes('build_arm');
    await buildSchema('tool_spec', [
        collectDirectory('pa_ex1/units/air', toolSpecFileFunc),
        collectDirectory('pa_ex1/units/land', toolSpecFileFunc),
        collectDirectory('pa_ex1/units/orbital', toolSpecFileFunc),
        collectDirectory('pa_ex1/units/sea', toolSpecFileFunc),
        collectDirectory('pa_ex1/tools', allFunc),

        collectDirectory('pa/units/air', toolSpecFileFunc),
        collectDirectory('pa/units/land', toolSpecFileFunc),
        collectDirectory('pa/units/orbital', toolSpecFileFunc),
        collectDirectory('pa/units/sea', toolSpecFileFunc),
        collectDirectory('pa/tools', allFunc)
    ]);

    const ammoSpecFileFunc = (dir, file) => file.includes('ammo');
    await buildSchema('ammo_spec', [
        collectDirectory('pa_ex1/units/air', ammoSpecFileFunc),
        collectDirectory('pa_ex1/units/land', ammoSpecFileFunc),
        collectDirectory('pa_ex1/units/orbital', ammoSpecFileFunc),
        collectDirectory('pa_ex1/units/sea', ammoSpecFileFunc),
        collectDirectory('pa_ex1/ammo', allFunc),

        collectDirectory('pa/units/air', ammoSpecFileFunc),
        collectDirectory('pa/units/land', ammoSpecFileFunc),
        collectDirectory('pa/units/orbital', ammoSpecFileFunc),
        collectDirectory('pa/units/sea', ammoSpecFileFunc),
        collectDirectory('pa/ammo', allFunc)
    ]);

    await buildSchema('pfx_spec', [
        collectDirectory('pa_ex1/units/air', allFunc, '.pfx'),
        collectDirectory('pa_ex1/units/land', allFunc, '.pfx'),
        collectDirectory('pa_ex1/units/orbital', allFunc, '.pfx'),
        collectDirectory('pa_ex1/units/sea', allFunc, '.pfx'),
        collectDirectory('pa_ex1/effects', allFunc, '.pfx'),

        collectDirectory('pa/units/air', allFunc, '.pfx'),
        collectDirectory('pa/units/land', allFunc, '.pfx'),
        collectDirectory('pa/units/orbital', allFunc, '.pfx'),
        collectDirectory('pa/units/sea', allFunc, '.pfx'),
        collectDirectory('pa/effects', allFunc, '.pfx')
    ]);

    await buildSchema('anim_tree_spec', [
        collectDirectory('pa_ex1/anim', (dir, file) => dir === 'anim_trees'),
        collectDirectory('pa/anim', (dir, file) => dir === 'anim_trees')
    ]);

    await buildSchema('ai_builds_spec', [
        collectDirectory('pa_ex1/ai', (dir, file) => dir.includes('builds')),
        collectDirectory('pa/ai', (dir, file) => dir.includes('builds'))
    ]);

    console.timeEnd('Done');
}
main();
