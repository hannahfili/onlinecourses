

import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails, updateCourse
} from './general-script.js';
// import axios from 'axios';

let fileInputRequired = id("avatar").required;
console.log(fileInputRequired);

let submitButton = id("upload-file-button");
submitButton.addEventListener('click', async function (e) { await uploadFileManager(e) });
async function uploadFileManager(e) {
    e.preventDefault();
    console.log("działa");

    const fileInput = document.querySelector('input[type="file"]');
    const formData = new FormData();
    if (fileInput.files.length == 0) console.log("nie ma pliku");

    formData.append('filename_disk', `${fileInput.files[0].name}`);
    formData.append('file', fileInput.files[0]);

    let errorOccured = false;
    let responseNotOkayFound = false;

    try {
        let response = await fetch(`${appAddress}/files`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) responseNotOkayFound = true;
        console.log(response.statusText);

    } catch (error) {
        console.log(error.message);
        errorOccured = true;

    }

    // var xhr = new XMLHttpRequest();
    // xhr.open("POST", `${appAddress}/files`);
    // xhr.send(formData);


    // await axios.post('/files', formData);

}