/**
 * This function is used for compress the PDF. Ghostscript is under AGPL license, therefore we re-distribuite the work we are doing
 * and other can contribute to this adding modification that will be used in the https://easypdfgenerator.com
 * @param event
 * @returns {Promise<{headers: {"Access-Control-Allow-Origin": string, "Content-Type": string}, body: *, statusCode: *}>}
 */
exports.pdfCompress = async (event) => {
    let requestObject = parseEvent(event);
    console.log(requestObject);

    const fileName = requestObject.fileName || './sample-advanced.pdf';
    //File used for testing
    let file = fileName || './sample-advanced.pdf';
    let fileToProcess = file;

    //Is store on S3 with a policy of 24h
    fileToProcess = await donwloadAndStoreOriginalFile(file, fileToProcess);

    //The tmp directory is the one used by serveless
    const fileOutput = '/tmp/compress.pdf';
    const directoryPath = '/tmp/';

    const {spawnSync} = require('child_process');

    //Process to compress
    var out = spawnSync('/opt/bin/gs', ['-q',
        '-dNOPAUSE',
        '-dBATCH',
        '-dQUIET',
        // '-dSAFER',
        '-sDEVICE=pdfwrite',
        // '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/screen',
        '-dDetectDuplicateImages',
        '-dFastWebView',
        // '-dEmbedAllFonts=true',
        // '-dSubsetFonts=true',
        // '-dColorImageDownsampleType=/Average',
        // '-dColorImageResolution=60',
        // '-dGrayImageDownsampleType=/Bicubic',
        // '-dGrayImageResolution=144',
        // '-dMonoImageDownsampleType=/Bicubic',
        // '-dMonoImageResolution=144',
        '-sOutputFile=' + fileOutput,
        fileToProcess]);
    // console.log(String(out.stdout));
    // console.log(String(out.stderr));

    // Read the file generated in the /tmp directory
    const files = fs.readdirSync(directoryPath);

    //Upload the files into an S3 bucket
    const filesUploaded = await uploadToS3(files, directoryPath);
    //Sign the files therefore the user can download it afterwards
    const output = await signFromS3(filesUploaded);

    return sendRes(200, JSON.stringify(output));
};
