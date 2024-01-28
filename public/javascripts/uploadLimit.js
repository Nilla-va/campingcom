
const fileInput = document.getElementById('images')

fileInput.addEventListener('change', function (event) {

    const selectedFiles = event.target.files;
    let selectedFilesSize = 0;
    for (let file of selectedFiles) {
        selectedFilesSize += file.size;
    }
    const maxFileCount = 3;
    const maxFileSize = 1024*1024*5;


    if (selectedFiles.length > maxFileCount) {
        alert(`최대 ${maxFileCount}개의 파일만 선택할 수 있습니다.`);
        fileInput.value = '';
     } else if (selectedFilesSize > maxFileSize) {
        alert(`최대 ${maxFileSize/1024/1024}MB의 파일만 선택할 수 있습니다.`);
        fileInput.value = '';
     }

})