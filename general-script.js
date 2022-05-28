// --------------------selectors--------------------

let id = (id) => document.getElementById(id);
let classes = (classes) => document.getElementsByClassName(classes);
let nameGetter = (names) => document.getElementsByName(names);

// --------------------END OF selectors--------------------

// --------------------roles' IDs--------------------
const appAddress = "https://3qyn4234.directus.app";
const studentRoleId = "063a370c-d078-44bf-b803-a84e72ca2255";
const teacherRoleId = "f3886bec-904f-4e69-82c6-31f3735f0e7b";
const adminRoleId = "cb3534ce-3c8d-4b22-86b7-6fb8f9646ccc";
// --------------------END OF roles' IDs--------------------

function validateEmail(inputText, outputPlace) {
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputText.match(mailformat)) {
        return true;
    }
    else {
        outputPlace.textContent = "Format maila jest niepoprawny!";
        return false;
    }
}

function validatePassword(myInput, outputPlace) {
    // Validate length
    if (myInput.length < 8) {
        outputPlace.textContent = "Hasło powinno zawierać co najmniej 8 znaków";
        return false;
    }
    else outputPlace.textContent = "";
    // Validate lowercase letters
    let lowerCaseLetters = /[a-z]/g;
    if (!myInput.match(lowerCaseLetters)) {
        outputPlace.textContent = "Hasło powinno zawierać małe litery";
        return false;
    }
    else outputPlace.textContent = "";
    // Validate capital letters
    let upperCaseLetters = /[A-Z]/g;
    if (!myInput.match(upperCaseLetters)) {
        outputPlace.textContent = "Hasło powinno zawierać wielkie litery";
        return false;
    }
    else outputPlace.textContent = "";

    // Validate numbers
    let numbers = /[0-9]/g;
    if (!myInput.match(numbers)) {
        outputPlace.textContent = "Hasło powinno zawierać liczby";
        return false;
    }
    else outputPlace.textContent = "";


    return true;
}
async function logOut() {
    let response;
    try {
        response = await fetch(`${appAddress}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{ "refresh_token": "${localStorage.getItem("refresh_token")}"}`
        });
    }
    catch (err) {
        console.error(`${err}`);
    }
    console.log(JSON.stringify(response));
    localStorage.clear();
    window.location = "index.html";
    return response;
}
async function redirectToIndexIfUserIsNotLoggedInAdmin() {
    let userIsLoggedAndAdmin = await checkIfUserIsLoggedInAndIfItIsAdmin();
    if (!userIsLoggedAndAdmin) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
async function checkIfUserIsLoggedInAndIfItIsAdmin() {
    if (!checkIfUserIsAdmin()) {
        console.log(localStorage.getItem("loggedInRole"));
        return false;
    }
    if (checkIfUserIsLoggedIn()) {
        // let tokenGotRefreshed = await refreshTokenIfExpired();
        let tokenGotRefreshed = await refreshToken();
        console.log(tokenGotRefreshed);
        return tokenGotRefreshed;
    }
    return false;
}
function checkIfUserIsAdmin() {
    if (localStorage.getItem("loggedInRole") == adminRoleId) return true;
    return false;
}
function checkIfUserIsLoggedIn() {
    if (localStorage.getItem("access_token") == null) return false;
    return true;
}
async function refreshToken() {
    localStorage.setItem("old_refresh_token", localStorage.getItem("refresh_token"));
    let responseWithNewToken;
    try {
        responseWithNewToken = await fetch(`${appAddress}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: `{ "refresh_token": "${localStorage.getItem("refresh_token")}"}`
        });
    }
    catch (err) {

        console.error(`${err}`);
        return false;
    }
    let responseJsonWithNewToken = await responseWithNewToken.json();
    if (!responseWithNewToken.ok) {
        if (responseJsonWithNewToken['errors'][0]['message'] == "Invalid user credentials.") {
            return false;
        }
    }

    localStorage.setItem("access_token", responseJsonWithNewToken["data"]["access_token"]);
    localStorage.setItem("refresh_token", responseJsonWithNewToken["data"]["refresh_token"]);
    return true;
}
async function getAllUsersFromDatabase() {
    console.log("refresh token get all users from database", localStorage.getItem("refresh_token"));
    let response;
    try {
        response = await fetch(`${appAddress}/users?limit=-1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        alert(err);
        console.error(`${err}`)
    }

    return response;
}
function enableDisableButton(checkbox, buttonToEnableOrDisable, numberOfBoxesChecked) {
    if (checkbox.checked) {
        numberOfBoxesChecked += 1;
        buttonToEnableOrDisable.classList.remove("disabled");
    }
    else {
        numberOfBoxesChecked -= 1;
        if (numberOfBoxesChecked < 1) {
            buttonToEnableOrDisable.classList.add("disabled");
        }
    }
    return numberOfBoxesChecked;
}
async function isolateParticularGroupOfUsersFromAllUsers(containerToDisplayError, roleId, infoToDisplay, typeOfIsolation) {
    let response = await getAllUsersFromDatabase();
    let responseJson = await response.json();
    if (!response.ok) {
        containerToDisplayError.textContent = infoToDisplay;
        return {};
    }
    let users = responseJson.data;
    let isolatedUsersDictionary = {};

    for (let i = 0; i < users.length; i++) {
        let obj = users[i];
        if (obj["role"] == roleId) {
            let userData = [obj["first_name"], obj["last_name"], obj["email"]];
            isolatedUsersDictionary[obj["id"]] = userData;
        }
    }
    // console.log(isolatedUsersDictionary);
    return isolatedUsersDictionary;
}
async function getAllCoursesFromDatabase() {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        console.error(`${err}`)
    }
    return response;
}
async function getAllItemsFromStudentsCoursesJunctionTable(containerForError) {
    let response;
    let errorCought = false;
    try {
        response = await fetch(`${appAddress}/items/junction_directus_users_Courses`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        // alert(err);
        console.error(`${err}`);
        errorCought = true;
    }
    let responseJson = [];
    if (!response.ok || errorCought) {
        containerForError.textContent = "Wystąpił problem z pobieraniem studentów";
        return responseJson;
    }
    responseJson = await response.json();
    // console.log(responseJson);
    return responseJson;
}
function getStudentsAssigned(allStudentsDictionary, studentsAssignedToThisCourse) {
    let studentsAssignedToThisCourseDict = {};
    for (let key in allStudentsDictionary) {
        let idFromStudentDictionary = key;
        for (let i = 0; i < studentsAssignedToThisCourse.length; i++) {
            let studentAssignedToThisCourseId = studentsAssignedToThisCourse[i];
            if (idFromStudentDictionary == studentAssignedToThisCourseId) {
                studentsAssignedToThisCourseDict[key] = allStudentsDictionary[key];
            }
        }
    }
    return studentsAssignedToThisCourseDict;
}
function getStudentsNotAssigned(allStudentsDictionary, studentsAssignedToThisCourse) {
    let thisStudentsIsAssignedToThisCourse = false;
    let students = {};

    for (let key in allStudentsDictionary) {
        let idFromStudentDictionary = key;
        thisStudentsIsAssignedToThisCourse = false;
        for (let i = 0; i < studentsAssignedToThisCourse.length; i++) {
            let studentAssignedToThisCourseId = studentsAssignedToThisCourse[i];
            if (idFromStudentDictionary == studentAssignedToThisCourseId) {
                thisStudentsIsAssignedToThisCourse = true;
                break;
            }
        }
        if (thisStudentsIsAssignedToThisCourse == false) {
            students[key] = allStudentsDictionary[key];
        }
    }

    return students;
}
async function updateCourse(courseId, fieldName, fieldValue, actualizationName) {
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "${fieldName}": "${fieldValue}"
            }`
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
async function deleteTeacherFromCourse(itemId, errorContainer, errorMessage) {
    // console.log("usuwamy", itemId);
    let response;
    let errorOccured = false;

    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (!response.ok || errorOccured) {
        errorContainer.textContent = errorMessage;
        return false;
    }

    return true;
}
async function getStudentsFromStudentsCoursesJunctionTable(courseId, getAssignedStudents = true, containerForError) {


    let allItemsFromStudentsCoursesJunctionTable = await getAllItemsFromStudentsCoursesJunctionTable(containerForError);
    let allStudentsDictionary = await isolateParticularGroupOfUsersFromAllUsers(containerForError, studentRoleId,
        "Problem z pobraniem studentów z serwera", "student");

    let data = allItemsFromStudentsCoursesJunctionTable.data;
    let studentsAssignedToThisCourse = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        // console.log(item["directus_users_id"]);
        if (item["Courses_id"] == courseId) studentsAssignedToThisCourse.push(item["directus_users_id"]);
    }
    // console.log(studentsAssignedToThisCourse);

    if (getAssignedStudents == true) {
        if (studentsAssignedToThisCourse.length == 0) { return null; }
        return getStudentsAssigned(allStudentsDictionary, studentsAssignedToThisCourse);
    }
    else {
        if (data.length == 0) return allStudentsDictionary;
        return getStudentsNotAssigned(allStudentsDictionary, studentsAssignedToThisCourse);
    }

}

async function getCourseDetails(courseId, errorContainer) {
    let response;
    let errorOccured=false;
    let responseNotOkayFound=false;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if(!response.ok) responseNotOkayFound=true;
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured=true;
    }
    if(responseNotOkayFound || errorOccured){
        errorContainer.textContent = `Nie udało załadować szczegółów kursu`;
        return null;
    } 

    return response;
}
async function getSectionsAssignedToTheModule(moduleId, containerForError) {
    let allSections = await getAllSections();

    if (allSections == null) {
        containerForError.textContent = "Wystąpił problem z pobraniem sekcji należących do modułu";
        return null;
    }
    let allSectionsJson = await allSections.json();
    
    let data = allSectionsJson.data;
    if (Object.keys(data).length === 0) return [];
    let sectionsAssignedToThisModule = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item["module"] == moduleId) sectionsAssignedToThisModule.push(item);
    }
    // console.log(sectionsAssignedToThisModule);
    return sectionsAssignedToThisModule;
}
async function getAllSections() {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Sections`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    // console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return null;
    return response;
}
function checkIfElementOccursInArrayMoreThanOnce(array) {
    let occursTwice = false;
    for (let i = 0; i < array.length; i++) {
        for (let k = i + 1; k < array.length; k++) {
            if (array[i] == array[k]) {
                occursTwice = true;
                break;
            }
        }
    }
    return occursTwice;
}
async function getTeachersDataToDisplay(course_directus_users_relation_ids) {
    let teachersData = {};
    let teachersDataToDisplay = [];
    // console.log(course_directus_users_relation_ids);
    for (let number in course_directus_users_relation_ids) {
        console.log(number);
        teachersData[course_directus_users_relation_ids[number]] = await getTeacherIdFromCourseDirectusUsersRelation(course_directus_users_relation_ids[number]);
    }
    for (let key in teachersData) {
        if (teachersData[key] != -1) {
            let data = await getTeacherDataById(teachersData[key]);
            if (data != -1) teachersDataToDisplay.push(data);
        }
    }
    // console.log(teachersData);
    return teachersDataToDisplay;
}
async function getTeacherIdFromCourseDirectusUsersRelation(id) {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (response.ok) {
            let json = await response.json();
            return json.data["directus_users_id"];
        }
    }
    catch (err) {
        alert(err);
        console.error(`${err}`);
        return -1;
    }

}
async function getTeacherDataById(id) {
    let response;
    try {
        response = await fetch(`${appAddress}/users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (response.ok) {
            let json = await response.json();
            let first_name = json.data["first_name"];
            let last_name = json.data["last_name"];
            let email = json.data["email"];
            if (first_name != null && last_name != null) return first_name + " " + last_name;
            else return email;
        }
    }
    catch (err) {
        alert(err);
        console.error(`${err}`);
        return -1;
    }
}
async function getModulesAssignedToThisCourse(courseId) {
    let allModulesResponse = await getAllModules();
    if (allModulesResponse == null) return null;
    let json = await allModulesResponse.json();
    let data = json.data;
    let modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue = {};
    if (data.length == 0) return modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue;
    for (let i = 0; i < data.length; i++) {
        if (data[i]["course"] == courseId) {
            modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue[data[i]["order_number"]] = data[i];
        }
    }
    return modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue;

}
async function getAllModules() {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Modules`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return null;
    return response;
}
async function addFileElementManager(element, sectionId, userCreated=localStorage.getItem("loggedInUserId")){
    
    let fileAddedId=await uploadFile(element["value"], element["file_name"]);
    if(fileAddedId==null){
        return false;        
    }
    let valuesToAddFileElement={
        "user_created": userCreated,
        "order_number": element["order_number"],        
        "section":sectionId,
        "file": fileAddedId
    }
    let valuesJson=JSON.stringify(valuesToAddFileElement);

    let errorOccured = false;
    let responseNotOkayFound = false;
    let responseJson;

    try {
        let response = await fetch(`${appAddress}/items/File_elements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: valuesJson,
        });
        if (!response.ok) responseNotOkayFound = true;
        console.log(response.statusText);
        responseJson=await response.json();

    } catch (error) {
        console.log(error.message);
        errorOccured = true;
    }
    if(errorOccured || responseNotOkayFound){
        return false;
    }
    return true;
}
async function uploadFile(file, fileName){
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename_download', fileName);

    let errorOccured = false;
    let responseNotOkayFound = false;
    let responseJson;

    try {
        let response = await fetch(`${appAddress}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: formData,
        });
        if (!response.ok) responseNotOkayFound = true;
        console.log(response.statusText);
        responseJson=await response.json();

    } catch (error) {
        console.log(error.message);
        errorOccured = true;
    }
    if(errorOccured || responseNotOkayFound){
        return null;
    }
    return responseJson.data["id"];
}
export {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse, getSectionsAssignedToTheModule, getAllSections, checkIfElementOccursInArrayMoreThanOnce,
    getTeachersDataToDisplay, getModulesAssignedToThisCourse, getAllModules, deleteTeacherFromCourse,
    addFileElementManager
};