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
    console.log(isolatedUsersDictionary);
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
export {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase
};