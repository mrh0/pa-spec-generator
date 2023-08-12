# Generates JSON-schemas for Planetery Annihilation: Titans spec files.

This Node.js script generates infered JSON-schemas based on the files in the PA `/media/pa_ex1` directory

## Supported spec types
- AI builds
- Ammo
- Animation Trees
- Build arms
- .pfx files
- Tools
- Units / Structures

The generated spec files are put in the [/specs](https://github.com/mrh0/pa-spec-generator/tree/main/specs) folder.

## Usage
### Generate spec files
```shell
npm start <path to Planetary Annihilation Titans>
```
### Use schemas
Visual Studio: Code supports JSON-schema validation by adding the following property with a link to the schema in the JSON file you are working in.
```json
{
  "$schema": "https://raw.githubusercontent.com/mrh0/pa-spec-generator/main/specs/ai_builds_spec.json",
  ...
}
```
