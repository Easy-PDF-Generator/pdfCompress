exports.pdfCompress = async (event, context) => {
    let requestObject = parseEvent(event);
    console.log(requestObject);

    const fileName = requestObject.fileName;

    //File used for testing
    let file = fileName || './sample-advanced.pdf';
    let fileToProcess = file;

    fileToProcess = await donwloadAndStoreOriginalFile(file, fileToProcess);

    //The tmp directory is the one used by serveless
    const fileOutput = '/tmp/compress.pdf';
    const directoryPath = '/tmp/';
    
    const {spawnSync} = require('child_process');
    var out = spawnSync('/opt/bin/magick', [
        'convert',
        '-density', '150',
        fileToProcess,
        '-quality', '90',
        fileOutput
    ]);
    console.log(util.inspect(out, false, null, true /* enable colors */))
    console.log(String(out.stdout));
    console.log(String(out.stderr));

    // Read the file generated in the /tmp directory
    const files = fs.readdirSync(directoryPath);

    //Upload the files into an S3 bucket
    const filesUploaded = await uploadToS3(files, directoryPath);
    //Sign the files therefore the user can download it afterwards
    const output = await signFromS3(filesUploaded);

    console.log(output);
    return sendRes(200, JSON.stringify(output));
};
