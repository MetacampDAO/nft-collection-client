import fs from "fs";
import path from "path";

export function readOrCreateFile(
    fileName: string,
    directoryPath: string,
    newData?: Record<string, any>
) : Record<string, any> {
    const filePath = path.join(directoryPath, fileName)

    // Check if the directory exists, if not create
    
    fs.access(directoryPath, fs.constants.F_OK, (err) => {
        if (err) {
            // If directory does not exist, create the directory
            fs.mkdir(directoryPath, { recursive: true }, (err) => {
            if (err) throw err;
            console.log(`Directory created: ${directoryPath}`);
            // Now you can proceed to read or create the file within this directory
            
        });
        }
    });

    let jsonData = readOrCreateJsonFile(filePath, newData);
    return jsonData


}

function readOrCreateJsonFile(filePath: string, newData?: Record<string, any>) {

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        // File exists, read its content
        const jsonString = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(jsonString);
        return jsonData

    } else {
        // File does not exist, create it with the provided content
        const jsonString = JSON.stringify(newData, null, 2)
        fs.writeFileSync(filePath, jsonString, 'utf-8');
        const jsonData = JSON.parse(jsonString);
        return jsonData
    }

};

export function updateJsonFile(filePath: string, collection_id: any, key: string, value: any){

    // Read the JSON file
    const data = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(data);

    json[key] = value;
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));

}

