// --------------------selectors--------------------

let id = (id) => document.getElementById(id);
let classes = (classes) => document.getElementsByClassName(classes);
let nameGetter = (names) => document.getElementsByName(names);

let register_form = id("register-form");
let log_in_form = id("log-in-form");
let edit_user_form = id("edit-user-form");
let add_user_form = id("add-user-form");
let add_course_form = id("add-course-form");
let edit_course_form = id("edit-course-form");
let checkboxesCount = 0;
let numberOfBoxesChecked = 0;
let numberToken = 1;
// --------------------END OF selectors--------------------

// --------------------roles' IDs--------------------
const appAddress = "https://3qyn4234.directus.app";
const studentRoleId = "063a370c-d078-44bf-b803-a84e72ca2255";
const teacherRoleId = "f3886bec-904f-4e69-82c6-31f3735f0e7b";
const adminRoleId = "cb3534ce-3c8d-4b22-86b7-6fb8f9646ccc";
// --------------------END OF roles' IDs--------------------

if (register_form) {
    register_form.addEventListener("submit", function (e) {
        registerManager(e);
    });
}
if (log_in_form) {
    log_in_form.addEventListener("submit", function (e) {
        logInManager(e);
    });
}
if (edit_user_form) {
    edit_user_form.addEventListener("submit", function (e, mode) {
        userManager(e, "edition");
    });
}
if (add_user_form) {
    add_user_form.addEventListener("submit", function (e, mode) {
        userManager(e, "addition");
    });
}
if (add_course_form) {
    add_course_form.addEventListener("submit", function (e, mode) {
        courseManager(e, "addition");
    });
}
if (edit_course_form) {
    edit_course_form.addEventListener("submit", function (e, mode) {
        courseManager(e, "edition");
    });
}

async function logInManager(e) {
    let email = id("email-log-in");
    let password = id("password-log-in");
    let emailErrorLogIn = id("email-log-in-error");
    let passwordErrorLogIn = id("password-log-in-error");

    e.preventDefault();

    let output = true;
    if (!validateEmail(email.value, emailErrorLogIn)) {
        output = false;
    }
    if (!validatePassword(password.value, passwordErrorLogIn)) {
        output = false;
    }
    if (output) {
        let response = await logIn(email.value, password.value);
        let responseJson = await response.json();
        if (response.ok) {
            //get users data: roleId
            let loggedInRole = await setLoggedUserData(email.value, password.value, responseJson);
            if (loggedInRole == teacherRoleId) window.location = "teacherPanel.html";
            else if (loggedInRole == studentRoleId) window.location = "studentPanel.html";
            else if (loggedInRole == adminRoleId) window.location = "adminPanel.html";
            else alert("Rola nieprzypisana!");
        }
        else {
            if (responseJson['errors'][0]['message'] == "Invalid user credentials.") {
                passwordErrorLogIn.textContent = "Niepoprawny login lub hasło";
            }
            console.log("error");
        }
    }
}
async function setLoggedUserData(email, password, responseJson) {
    localStorage.setItem("loggedInEmail", email);
    localStorage.setItem("loggedInPassword", password);
    localStorage.setItem("access_token", responseJson["data"]["access_token"]);
    localStorage.setItem("refresh_token", responseJson["data"]["refresh_token"]);

    let response;
    try {
        response = await fetch(`${appAddress}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        const responseJsonAboutMe = await response.json();
        localStorage.setItem("loggedInRole", responseJsonAboutMe["data"]["role"]);
        localStorage.setItem("loggedInPlatformAccessTimeout", responseJsonAboutMe["data"]["platform_access_timeout"]);
    }
    catch (err) {
        console.error(`${err}`);
    }
    // wypisz();
    return localStorage.getItem("loggedInRole");

}
function wypisz() {
    console.log(localStorage.getItem("loggedInEmail"));
    console.log(localStorage.getItem("loggedInPassword"));
    console.log(localStorage.getItem("access_token"));
    console.log(localStorage.getItem("refresh_token"));
    console.log(localStorage.getItem("loggedInRole"));
    console.log(localStorage.getItem("loggedInPlatformAccessTimeout"));
}
async function logIn(email, password) {
    let response;
    try {
        response = await fetch(`${appAddress}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{
           "email": "${email}",
           "password": "${password}"
          }`,
        });
    }
    catch (err) {
        console.error(`${err}`)
    }

    return response;

}
function validateRegistrationData() {
    let output = true;
    let email = id("email");
    let password = id("password");
    let password2 = id("password-2");
    let emailErrorRegister = id("email-error");
    let passwordErrorOneRegister = id("password-error");
    let passwordErrorTwoRegister = id("password2-error");

    if (!validateEmail(email.value, emailErrorRegister)) {
        output = false;
    }
    if (!validatePassword(password.value, passwordErrorOneRegister)) {
        output = false;
    }
    if (!validatePassword(password2.value, passwordErrorTwoRegister)) {
        output = false;
    }
    if (password.value !== password2.value) {
        passwordErrorTwoRegister.textContent = "Hasła muszą być takie same";
        output = false;
    }
    else {
        passwordErrorTwoRegister.textContent = "";
    }
    return output;
}

async function registerManager(e) {
    e.preventDefault();

    let response = false;
    let output = validateRegistrationData();

    if (output === true) {
        //utworz konto
        response = await createAccount(email.value, password.value);
        if (!response.ok) {
            const responseJson = await response.json();
            if (responseJson['errors'][0]['message'] == "Field \"email\" has to be unique.") {
                passwordErrorTwoRegister.textContent = "W systeme istnieje już taki adres email";
            }
            else {
                passwordErrorTwoRegister.textContent = "Podczas rejestracji wystąpił błąd. Spróbuj ponownie";
            }
        }
        else {
            window.location = "index.html";
        }

    }

}

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
function focus() {
    let email = id("email");
    email.focus();
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
async function createAccount(email, password, studentAccount = true) {
    let roleId = studentAccount ? studentRoleId : teacherRoleId;

    // alert("rola studenta: ", roleId);
    // alert("rola tutejsza:", roleId);

    let response;
    const date = new Date();
    let initialPlatformAccessTimeout = new Date(date.setDate(date.getDate() + 30));
    let initialPlatformAccessTimeoutAsString = JSON.stringify(initialPlatformAccessTimeout);
    console.log(initialPlatformAccessTimeoutAsString);
    try {
        response = await fetch(`${appAddress}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{
           "email": "${email}",
           "password": "${password}",
           "role": "${roleId}",
           "platform_access_timeout": ${initialPlatformAccessTimeoutAsString}
          }`,
        });
    }
    catch (err) {
        console.error(`${err}`)
    }

    return response;

}
//-----------------------------ADMIN'S PANEL-----------------------------

let admin_users_all_users = id("admin-users-all-users");

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

function checkIfUserIsLoggedIn() {
    if (localStorage.getItem("access_token") == null) return false;
    return true;
}
async function refreshTokenIfExpired() { // zrob funkcje do odswiezania tokenu!
    if (localStorage.getItem("refresh_token") === null) return false;
    console.log("refresh token expired: ", localStorage.getItem("refresh_token"));

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
    responseJsonWithNewToken = await responseWithNewToken.json();
    // console.log(JSON.stringify(responseJsonWithNewToken));
    if (!responseWithNewToken.ok) {
        if (responseJsonWithNewToken['errors'][0]['message'] == "Invalid user credentials.") {
            // alert("Sesja wygasła. Zaloguj się ponownie");
            // window.location("/index.html");
            return false;
        }
    }
    // console.log(JSON.stringify(responseJsonWithNewToken));
    // console.log("stary refresh_token", localStorage.getItem("refresh_token"));
    // console.log("stary access_token", localStorage.getItem("access_token"));
    // console.log("responseJson: ", responseJsonWithNewToken["data"]["access_token"]);

    localStorage.setItem("access_token", responseJsonWithNewToken["data"]["access_token"]);
    localStorage.setItem("refresh_token", responseJsonWithNewToken["data"]["refresh_token"]);
    // numberToken++;
    // console.log("nowy access_token", localStorage.getItem("access_token"));
    console.log("nowy refresh_token", localStorage.getItem("refresh_token"));
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
    responseJsonWithNewToken = await responseWithNewToken.json();
    if (!responseWithNewToken.ok) {
        if (responseJsonWithNewToken['errors'][0]['message'] == "Invalid user credentials.") {
            return false;
        }
    }

    localStorage.setItem("access_token", responseJsonWithNewToken["data"]["access_token"]);
    localStorage.setItem("refresh_token", responseJsonWithNewToken["data"]["refresh_token"]);
    return true;
}
function checkIfUserIsAdmin() {
    if (localStorage.getItem("loggedInRole") == adminRoleId) return true;
    return false;
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

async function displayAllUsers() {
    // wypisz();
    console.log("display users access token", localStorage.getItem("access_token"));
    console.log("display users refresh token", localStorage.getItem("refresh_token"));
    // await redirectToIndexIfUserIsNotLoggedInAdmin();
    let userIsLoggedIn = await checkIfUserIsLoggedInAndIfItIsAdmin();
    if (!userIsLoggedIn) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        // window.location.href = "/index.html";
    }

    let response = await getAllUsersFromDatabase();
    if (response.ok) {
        await displayUsersOneByOne(response);
    }
    else {
        alert('Problem z wczytaniem użytkowników!');
        console.log("error");
    }
}
async function displayUsersOneByOne(response) {
    var mainContainer = id("admin-users-all-users-table-display");
    let buttonToDeleteManyUsers = id("admin-users-delete-many-users");
    const json = await response.json();
    checkboxesCount = json.data.length;
    let checkboxesElements = {};
    console.log(json);
    for (var i = 0; i < json.data.length; i++) {
        (function (index) {
            var person = json.data[index];
            var email = person["email"];

            const row = document.createElement('tr');

            const emailBox = document.createElement('td');
            emailBox.setAttribute('id', `user-details-email-${person["id"]}`);
            emailBox.textContent = `${email}`;
            row.appendChild(emailBox);

            const editBox = document.createElement('td');
            editBox.setAttribute('id', `user-details-editbox-user-${person["id"]}`);

            const buttonEditUser = document.createElement('button');
            buttonEditUser.setAttribute('id', `button-admin-users-edit-user-${person["id"]}`);
            buttonEditUser.setAttribute('class', `btn btn-secondary`);
            buttonEditUser.textContent = "Edytuj dane";
            buttonEditUser.addEventListener('click', function (e) { e.preventDefault(); saveUserToEditAndRedirect(person) });



            editBox.appendChild(buttonEditUser);
            row.appendChild(editBox);

            const deleteBox = document.createElement('td');
            deleteBox.setAttribute('id', `user-details-deletebox-user-${person["id"]}`);

            const buttonDeleteUser = document.createElement('button');
            buttonDeleteUser.setAttribute('id', `button-admin-users-delete-user-${person["id"]}`);
            buttonDeleteUser.setAttribute('class', `btn btn-secondary`);
            buttonDeleteUser.textContent = "Usuń użytkownika";
            buttonDeleteUser.addEventListener('click', function () { deleteManager(person) });
            deleteBox.appendChild(buttonDeleteUser);
            row.appendChild(deleteBox);

            const roleBox = document.createElement('td');
            roleBox.setAttribute('id', `user-details-rolebox-user-${person["id"]}`);

            if (person["role"] != teacherRoleId) {
                const buttonBestowTeacherRoleUponPerson = document.createElement('button');
                buttonBestowTeacherRoleUponPerson.setAttribute('id', `button-admin-users-bestow-teacher-role-${person["id"]}`);
                buttonBestowTeacherRoleUponPerson.setAttribute('class', `btn btn-secondary btn-success`);
                buttonBestowTeacherRoleUponPerson.textContent = "Nadaj rolę nauczyciela";

                buttonBestowTeacherRoleUponPerson.addEventListener('click', function () { updateUserData(person["id"], "role", teacherRoleId, "bestow teacher role") });
                roleBox.appendChild(buttonBestowTeacherRoleUponPerson);
            }
            else {
                const buttonCancelTeacherRoleUponPerson = document.createElement('button');
                buttonCancelTeacherRoleUponPerson.setAttribute('id', `button-admin-users-cancel-teacher-role-${person["id"]}`);
                buttonCancelTeacherRoleUponPerson.setAttribute('class', `btn btn-secondary`);
                buttonCancelTeacherRoleUponPerson.textContent = "Odbierz rolę nauczyciela";

                buttonCancelTeacherRoleUponPerson.addEventListener('click', function () { updateUserData(person["id"], "role", studentRoleId, "cancel teacher role") });
                roleBox.appendChild(buttonCancelTeacherRoleUponPerson);
            }
            row.appendChild(roleBox);

            const checkboxBox = document.createElement('td');
            checkboxBox.setAttribute('id', `user-details-checkbox-user-${person["id"]}`);

            const checkbox = document.createElement('input');
            checkbox.setAttribute('id', `checkbox-admin-users-${person["id"]}`);
            checkbox.setAttribute('class', `form-check-input`);
            checkbox.setAttribute('type', 'checkbox');
            checkbox.addEventListener('click', function () { enableDisableButton(this, buttonToDeleteManyUsers) });
            checkboxesElements[`${person["id"]}`] = checkbox;
            checkboxBox.appendChild(checkbox);

            row.appendChild(checkboxBox);

            mainContainer.appendChild(row);
        })(i);
    }

    buttonToDeleteManyUsers.addEventListener('click', function (e) { deleteManyUsers(e, checkboxesElements) });

}
async function deleteManyUsers(e, checkboxesElements) {
    e.preventDefault();
    let mainContainer = id("admin-users-all-users");
    let usersToDelete = "[";
    for (let key in checkboxesElements) {
        if (checkboxesElements[key].checked) {
            console.log("usunac: ", key);
            usersToDelete += '"';
            usersToDelete += key;
            usersToDelete += '"';
            usersToDelete += ", ";
        }
    }
    let removeLastCommaAndSpace = usersToDelete.slice(0, usersToDelete.length - 2);
    let jsonUsersArray = removeLastCommaAndSpace += "]";
    console.log(jsonUsersArray);
    let answer = window.confirm(`Czy na pewno chcesz usunąć zaznaczonych użytkowników?`);

    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    if (answer) {
        try {
            id("admin-users-all-users-table").remove();
            id("admin-users-delete-many-users").remove();
            response = await fetch(`${appAddress}/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
                },
                body: jsonUsersArray
            });

            if (response.ok) {

                let success = document.createElement('div');
                success.setAttribute('class', `success`);
                success.setAttribute('id', `admin-users-success-div`);
                success.textContent = `Usunięto zaznaczonych użytkowników`;
                mainContainer.appendChild(success);
            }
            else {
                responseNotOkayFound = true;
            }

        }
        catch (err) {
            console.error(`${err}`);
            errorOccured = true;
        }
        if (errorOccured || responseNotOkayFound) {
            let failure = document.createElement('div');
            failure.setAttribute('class', `failure`);
            failure.setAttribute('id', `admin-users-failure-div`);
            failure.textContent = `Nie udało się usunąć zaznaczonych użytkowników`;
            mainContainer.appendChild(failure);
        }

        let returnButton = document.createElement('button');
        returnButton.setAttribute('id', 'admin-users-return-button');
        returnButton.addEventListener('click', function () { window.location = "admin-users.html" });
        returnButton.textContent = "Wróć do menadżera użytkowników";
        mainContainer.appendChild(returnButton);
    }

}
function enableDisableButton(checkbox, buttonToEnableOrDisable) {
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
}

async function deleteManager(person) {
    let userId = person["id"];
    let confirmed = confirmDeletion(person);
    let message;
    if (confirmed) {
        await deleteFromDatabase(userId);
        message = `Usunięto użytkownika: ${person["email"]}`;
    }
    else {
        message = `Użytkownik ${person["email"]} nie został usunięty`;
    }
    alert(message);
    if (confirmed) document.location.reload();
}
function confirmDeletion(user) {
    console.log(JSON.stringify(user));
    let email = user["email"];
    let answer = window.confirm(`Czy na pewno chcesz usunąć poniższego użytkownika?\n${email}`);
    return answer;
}

async function deleteFromDatabase(userId) {
    let response;
    try {
        response = await fetch(`${appAddress}/users/${userId}`, {
            method: 'DELETE',
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
}
function saveUserToEditAndRedirect(userDataJson) {

    localStorage.setItem("edit_user_id", userDataJson["id"]);
    localStorage.setItem("edit_user_firstName", userDataJson["first_name"]);
    localStorage.setItem("edit_user_lastName", userDataJson["last_name"]);
    localStorage.setItem("edit_user_email", userDataJson["email"]);

    // console.log(localStorage.getItem("edit_user_firstName"));
    // console.log(localStorage.getItem("edit_user_lastName"));
    // console.log(localStorage.getItem("edit_user_email"));

    window.location = "/editUser.html";
}
async function redirectToIndexIfUserIsNotLoggedInAdmin() {
    let userIsLoggedAndAdmin = await checkIfUserIsLoggedInAndIfItIsAdmin();
    if (!userIsLoggedAndAdmin) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}

async function setEditUserDefaultFields() {
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    //-------------JAK ZDAZYSZ TO TO POPRAW-----------------
    // let returnButton = id("editUser-return-admin-users");
    // returnButton.addEventListener('click', function (e) {
    //     e.preventDefault;
    //     window.location = "admin-users.html";
    // })
    //-----------------------------------------------------
    let firstName = localStorage.getItem("edit_user_firstName");
    let lastName = localStorage.getItem("edit_user_lastName");
    let email = localStorage.getItem("edit_user_email");

    let firstNameElement = nameGetter("edit-user-first-name");
    let lastNameElement = nameGetter("edit-user-last-name");
    let emailElement = nameGetter("edit-user-email");


    firstName != "null" ? firstNameElement[0].placeholder = firstName : firstNameElement[0].placeholder = "";
    lastName != "null" ? lastNameElement[0].placeholder = lastName : lastNameElement[0].placeholder = "";
    email != "null" ? emailElement[0].placeholder = email : emailElement[0].placeholder = "";

    console.log(localStorage.getItem("edit_user_firstName"));
    console.log(localStorage.getItem("edit_user_lastName"));
    console.log(localStorage.getItem("edit_user_email"));

    console.log("set edit refresh: ", localStorage.getItem("refresh_token"));


}
async function userManager(e, mode) {

    e.preventDefault();
    console.log("userManager");
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    let checked = false;
    let prefix;
    if (mode == "edition") prefix = "edit";
    else {
        prefix = "add";
        if (id("add-user-bestow-teacher-role").checked) {
            checked = true;
            console.log(checked);
        }
    }
    let mainContainer = id(`${prefix}-user-main-container`);

    let firstNameElement = id(`${prefix}-user-first-name`);
    let lastNameElement = id(`${prefix}-user-last-name`);
    let emailElement = id(`${prefix}-user-email`);
    let passwordElementOne = id(`${prefix}-user-password`);
    let passwordElementTwo = id(`${prefix}-user-password-2`);

    console.log(firstNameElement.value);
    console.log(lastNameElement.value);
    console.log(emailElement.value);
    console.log(passwordElementOne.value);
    console.log(passwordElementTwo.value);

    let passwordOneErrorContainer = id(`${prefix}-user-password-error`);
    let passwordTwoErrorContainer = id(`${prefix}-user-password2-error`);
    let emailErrorContainer = id(`${prefix}-user-email-error`);


    let validated = validateAdditionOrEditionData(emailElement.value, passwordElementOne.value, passwordElementTwo.value,
        passwordOneErrorContainer, passwordTwoErrorContainer, emailErrorContainer);
    console.log(validated);
    console.log(firstNameElement.value);
    console.log(lastNameElement.value);
    let errorContainer = id(`${prefix}-user-all-error`);

    if (validated) {
        const valuesToUpdate = makeDictionaryOfInputData(emailElement.value,
            passwordElementOne.value, firstNameElement.value, lastNameElement.value);
        if (mode == "addition") {
            if (checked) valuesToUpdate["role"] = teacherRoleId;
            else valuesToUpdate["role"] = studentRoleId;
        }

        for (let key in valuesToUpdate) {
            console.log(key, ": ", valuesToUpdate[key]);
        }
        if (mode == "edition") updateUserDataManager(valuesToUpdate, errorContainer, mainContainer)
        else addUserDataManager(valuesToUpdate, errorContainer, mainContainer);
    }
    else {
        errorContainer.textContent = `Wprowadzono niepoprawne dane. Spróbuj jeszcze raz`;
    }
}
async function updateUserDataManager(valuesToUpdate, errorContainer, mainContainer) {
    let response;
    let allResponses;
    let responseNotOkayFound = false;

    for (let key in valuesToUpdate) {
        if (valuesToUpdate[key] != "") {
            console.log(valuesToUpdate[key]);
            console.log(key);
            response = await updateUserData(localStorage.getItem("edit_user_id"), key, valuesToUpdate[key], `edit_${key}`);
            allResponses.push(respone);
        }
    }
    for (let partResponse in allResponses) {
        if (!partResponse.ok) {
            errorContainer.textContent = `Wystąpił problem przy aktualizacji danej: ${key}`;
            responseNotOkayFound = true;
            break;
        }
    }
    if (!responseNotOkayFound) {
        edit_user_form.remove();
        let success = document.createElement('div');
        success.setAttribute('class', `success`);
        success.setAttribute('id', `edit-user-success-div`);
        success.textContent = `Udało się dodać użytkownika: ${email}`;

        let returnButton = document.createElement('button');
        returnButton.setAttribute('id', 'edit-user-return-button');
        returnButton.addEventListener('click', function () { window.location = "admin-users.html" });
        returnButton.textContent = "Wróć do menadżera użytkowników";


        mainContainer.appendChild(success);
        mainContainer.appAddress(returnButton);

    }
}
async function addUserDataManager(valuesToAdd, errorContainer, mainContainer) {
    let jsonValues = JSON.stringify(valuesToAdd);
    let response;
    try {
        response = await fetch(`${appAddress}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonValues
        });
        if (!response.ok) {
            errorContainer.textContent = `Wystąpił problem przy dodawaniu użytkownika - ${response.statusText}`;
        }
        else {
            add_user_form.remove();
            let success = document.createElement('div');
            success.setAttribute('class', `success`);
            success.setAttribute('id', `add-user-success-div`);
            success.textContent = `Udało się dodać użytkownika: ${valuesToAdd["email"]}`;

            let returnButton = document.createElement('button');
            returnButton.setAttribute('id', 'add-user-return-button');
            returnButton.addEventListener('click', function () { window.location = "admin-users.html" });
            returnButton.textContent = "Wróć do menadżera użytkowników";


            mainContainer.appendChild(success);
            mainContainer.appendChild(returnButton);
        }
    }
    catch (err) {
        console.error(`${err}`)

    }


}
function makeDictionaryOfInputData(email, passwordOne, firstName, lastName) {
    const data = {
        "email": email,
        "password": passwordOne,
        "first_name": firstName,
        "last_name": lastName
    };
    return data;

}
function validateAdditionOrEditionData(email, passwordOne, passwordTwo,
    passwordOneErrorContainer, passwordTwoErrorContainer, emailErrorContainer) {

    if (email != "") {
        if (!validateEmail(email, emailErrorContainer)) return false;
    }
    if (passwordOne != "" && passwordTwo != "") {
        if (!validatePassword(passwordOne, passwordOneErrorContainer)) return false;
        if (!validatePassword(passwordTwo, passwordTwoErrorContainer)) return false;
        if (passwordOne != passwordTwo) {
            passwordTwoErrorContainer.textContent = "Hasła muszą być takie same";
            return false;
        }
    }
    return true;

}
async function updateUserData(userId, fieldName, fieldValue, actualizationName) {
    console.log(actualizationName);
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    let response;
    try {
        response = await fetch(`${appAddress}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "${fieldName}": "${fieldValue}"
            }`
        });
    }
    catch (err) {
        alert(err);
        console.error(`${err}`)
    }
    // console.log(response.statusText);
    // let json = await response.json();
    // console.log(JSON.stringify(json));
    return response;
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
async function getTeachersDataToDisplay(course_directus_users_relation_ids) {
    let teachersData = {};
    let teachersDataToDisplay = [];
    console.log(course_directus_users_relation_ids);
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
    console.log(teachersData);
    return teachersDataToDisplay;
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

async function displayAllCourses() {
    for (key in localStorage) {
        if (key.substring(0, 11) == 'new-select-') {
            localStorage.removeItem(key);
        }
    }
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    let courses = await getAllCoursesFromDatabase();
    let mainContainer = id("admin-courses-all-courses-table-display");

    if (!courses.ok) {
        id("admin-courses-all-courses").remove();
        id("admin-courses-delete-many-courses").remove();
        id("admin-courses-error-message").textContent = "Nie udało się pobrać danych"
    }
    else {
        const coursesJson = await courses.json();
        console.log(JSON.stringify(coursesJson));
        if (coursesJson.data.length == 0) {
            id("admin-courses-all-courses").remove();
            id("admin-courses-delete-many-courses").remove();
            id("admin-courses-error-message").textContent = "Nie dodano jeszcze żadnego kursu!"
        }
        else {

        }
        for (var i = 0; i < coursesJson.data.length; i++) {
            (async function (index) {
                var course = coursesJson.data[index];
                let name = course["name"];

                let teachers = await getTeachersDataToDisplay(course["teacher"]);
                let description = course["description"];
                //utworzenie wiersza
                const row = document.createElement('tr');
                //utworzenie okienka na nazwę kursu
                const courseBox = document.createElement('td');
                courseBox.setAttribute('id', `course-details-name-${course["id"]}`);
                courseBox.textContent = `${name}`;
                row.appendChild(courseBox);

                // console.log(teachers);
                //utworzenie okienka na nauczycieli
                const teachersBox = document.createElement('td');
                teachersBox.setAttribute('id', `course-details-teacher-${teachers[i]}`);
                for (let i in teachers) {
                    let text = document.createTextNode(`${teachers[i]}`);
                    teachersBox.appendChild(text);
                    let comma = document.createTextNode(", ");
                    console.log(i);
                    if (i != teachers.length - 1) teachersBox.appendChild(comma);
                }
                row.appendChild(teachersBox);

                //utworzenie okienka na przycisk do edycji kursu
                const editBox = document.createElement('td');
                editBox.setAttribute('id', `course-details-edit-${course["id"]}`);
                const buttonEditCourse = document.createElement('button');
                buttonEditCourse.setAttribute('id', `button-admin-courses-edit-course-${course["id"]}`);
                buttonEditCourse.setAttribute('class', `btn btn-secondary`);
                buttonEditCourse.textContent = "Edytuj kurs";
                buttonEditCourse.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.setItem("courseIdEdit", course["id"]);
                    window.location = "editCourse.html";
                });

                editBox.appendChild(buttonEditCourse);
                row.appendChild(editBox);
                //utworzenie okienka na przycisk do usuwania kursu
                const deleteBox = document.createElement('td');
                deleteBox.setAttribute('id', `course-details-delete-${course["id"]}`);
                const buttonDeleteCourse = document.createElement('button');
                buttonDeleteCourse.setAttribute('id', `button-admin-courses-delete-course-${course["id"]}`);
                buttonDeleteCourse.setAttribute('class', `btn btn-secondary`);
                buttonDeleteCourse.textContent = "Usuń kurs";
                buttonDeleteCourse.addEventListener('click', function () { /*FUNKCJA DO USUWANIA KURSU*/ });

                deleteBox.appendChild(buttonDeleteCourse);
                row.appendChild(deleteBox);

                //utworzenie okienka na przycisk do dodawania ucznia do kursu
                const addStudentBox = document.createElement('td');
                addStudentBox.setAttribute('id', `course-details-add-student-${course["id"]}`);
                const buttonAddStudent = document.createElement('button');
                buttonAddStudent.setAttribute('id', `button-admin-courses-add-student-${course["id"]}`);
                buttonAddStudent.setAttribute('class', `btn btn-secondary`);
                buttonAddStudent.textContent = "Dodaj uczniów";
                buttonAddStudent.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.location = "addStudentsToCourse.html";
                    localStorage.setItem("courseIdToAddStudents", course["id"]);
                });

                addStudentBox.appendChild(buttonAddStudent);
                row.appendChild(addStudentBox);

                //utworzenie okienka na przycisk do otworzenia szczegółów kursu
                const showDetailsBox = document.createElement('td');
                showDetailsBox.setAttribute('id', `course-details-show-details-${course["id"]}`);
                const buttonShowDetails = document.createElement('button');
                buttonShowDetails.setAttribute('id', `button-admin-courses-show-details-${course["id"]}`);
                buttonShowDetails.setAttribute('class', `btn btn-secondary`);
                buttonShowDetails.textContent = "Pokaż szczegóły";
                buttonShowDetails.addEventListener('click', function () { /*FUNKCJA DO USUWANIA KURSU*/ });

                showDetailsBox.appendChild(buttonShowDetails);
                row.appendChild(showDetailsBox);

                //utworzenie okienka na przycisk do aktywacji/dezaktywacji kursu
                const activateDesactivateBox = document.createElement('td');
                activateDesactivateBox.setAttribute('id', `course-details-activate-desactivate-${course["id"]}`);
                const buttonActivateDesactivate = document.createElement('button');
                buttonActivateDesactivate.setAttribute('id', `button-admin-courses-activate-desactivate-${course["id"]}`);
                buttonActivateDesactivate.setAttribute('class', `btn btn-secondary`);
                let enableOrDisable = "";
                course["activity_status"] == "disabled" ? enableOrDisable = "Aktywuj" : enableOrDisable = "Dezaktywuj";
                // if(course["activity_status"]=="disabled"){
                //     enableOrDisable="Aktywuj kurs"
                // }
                // else{

                // }
                buttonActivateDesactivate.textContent = enableOrDisable;
                buttonActivateDesactivate.addEventListener('click', function () { /*FUNKCJA DO (dez)    aktywacji KURSU*/ });

                activateDesactivateBox.appendChild(buttonActivateDesactivate);
                row.appendChild(activateDesactivateBox);


                mainContainer.appendChild(row);


            })(i);

        }
    }
}
function displayStudentsDetails(studentsDictionary, buttonToAddManyStudents) {
    let errorContainer = id("addStudentsToCourse-error-place");
    let mainContainer = id("addStudentsToCourse-students-not-assigned-to-this-course-display");
    let checkboxesElements = {};
    if (Object.keys(studentsDictionary).length == 0) errorContainer.textContent = "Brak uczniów, których można dodać do kursu";
    console.log(Object.keys(studentsDictionary).length);
    for (let key in studentsDictionary) {
        const row = document.createElement('tr');

        const emailBox = document.createElement('td');
        emailBox.setAttribute('id', `addStudentsToCourse-email-${key}`);
        emailBox.textContent = studentsDictionary[key][2];
        row.appendChild(emailBox);

        const first_nameBox = document.createElement('td');
        first_nameBox.setAttribute('id', `addStudentsToCourse-first-name-${key}`);
        first_nameBox.textContent = studentsDictionary[key][0];
        row.appendChild(first_nameBox);

        const last_nameBox = document.createElement('td');
        last_nameBox.setAttribute('id', `addStudentsToCourse-last-name-${key}`);
        last_nameBox.textContent = studentsDictionary[key][1];
        row.appendChild(last_nameBox);

        const checkboxBox = document.createElement('td');
        checkboxBox.setAttribute('id', `addStudentsToCourse-checkbox-box-${key}`);

        const checkbox = document.createElement('input');
        checkbox.setAttribute('id', `addStudentsToCourse-checkbox-${key}`);
        checkbox.setAttribute('class', `form-check-input`);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', function () { enableDisableButton(this, buttonToAddManyStudents) });
        checkboxesElements[key] = checkbox;
        checkboxBox.appendChild(checkbox);

        row.appendChild(checkboxBox);

        mainContainer.appendChild(row);
    }
    return checkboxesElements;


}
async function addStudentsToCourse(courseId = localStorage.getItem("courseIdToAddStudents")) {

    redirectToIndexIfUserIsNotLoggedInAdmin();
    let buttonReturn = id("addStudentsToCourse-return-button");
    let buttonToAddManyStudents = id("addStudentsToCourse-add-many-students");

    let studentsWhoAreNotAssignedToTheCourseIDs = await getStudentsFromStudentsCoursesJunctionTable(courseId, false,);
    console.log(studentsWhoAreNotAssignedToTheCourseIDs);
    let checkboxesElements = displayStudentsDetails(studentsWhoAreNotAssignedToTheCourseIDs, buttonToAddManyStudents);

    buttonToAddManyStudents.addEventListener('click', function (e) {
        addManyStudentsToCourse(e, checkboxesElements, courseId);
        // let studentsDetailsBasedOnIds = await getStudentsDetailsBasedOnIds(studentsWhoAreNotAssignedToTheCourseIDs);
    });
    buttonReturn.addEventListener('click', function (e) {
        e.preventDefault();
        window.location = "admin-courses.html";
    })
}
const getStudentsChecked = function (studentsCheckboxesElements, courseId) {
    return Object.entries(studentsCheckboxesElements).reduce((a, [k, v]) => {
        if (v.checked) a.push({ "directus_users_id": k, "Courses_id": courseId });
        return a;
    }, []);
}
//DOKONCZYC DODAWANIE WIEKSZEJ LICZBY STUDENTOW DO KURSU
async function addManyStudentsToCourse(e, studentsCheckboxesElements, courseId) {

    e.preventDefault();
    console.log(studentsCheckboxesElements);
    let mainContainer = id("addStudentsToCourse-students-not-assigned-to-this-course");
    let studentsToAddToCourse = "[";
    for (let key in studentsCheckboxesElements) {
        if (studentsCheckboxesElements[key].checked) {
            console.log("dodac: ", key);
            studentsToAddToCourse += '"';
            studentsToAddToCourse += key;
            studentsToAddToCourse += '"';
            studentsToAddToCourse += ", ";
        }
    }
    // let studentsChecked=Object.keys(studentsCheckboxesElements).reduce(function(studentsChecked, key)){
    //     if(studentsCheckboxesElements[key].checked) studentsChecked.push(key);
    // }
    let studentsChecked = getStudentsChecked(studentsCheckboxesElements, courseId);
    console.log(studentsChecked);
    // studentsCheckboxesElements.forEach(function (box) {
    //     if (box)
    //         one_acc.userName = one_acc.owner.toLowerCase().split(' ').map(name => name[0]).join('');
    // })
    let removeLastCommaAndSpace = studentsToAddToCourse.slice(0, studentsToAddToCourse.length - 2);
    let jsonUsersArray = removeLastCommaAndSpace += "]";
    // console.log(jsonUsersArray);
    // console.log(JSON.stringify(studentsChecked));
    let dataToPost = JSON.stringify(studentsChecked);
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    id("addStudentsToCourse-students-not-assigned-to-this-course-table").remove();
    id("addStudentsToCourse-add-many-students").remove();
    try {

        response = await fetch(`${appAddress}/items/junction_directus_users_Courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPost
        });

        if (response.ok) {

            let success = document.createElement('div');
            success.setAttribute('class', `success`);
            success.setAttribute('id', `addStudentsToCourse-success-div`);
            success.textContent = `Dodano zaznaczonych użytkowników`;
            mainContainer.appendChild(success);
        }
        else {
            responseNotOkayFound = true;
        }

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (errorOccured || responseNotOkayFound) {
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `addStudentsToCourse-failure-div`);
        failure.textContent = `Nie udało się dodać zaznaczonych użytkowników`;
        mainContainer.appendChild(failure);
    }

    let returnButton = document.createElement('button');
    returnButton.setAttribute('id', 'addStudentsToCourse-return-button');
    returnButton.addEventListener('click', function () { window.location = "admin-courses.html" });
    returnButton.textContent = "Wróć do menadżera kursów";
    mainContainer.appendChild(returnButton);
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
    responseJson = response.json();
    console.log(responseJson);
    return responseJson;
}
async function getStudentsFromStudentsCoursesJunctionTable(courseId, getAssignedStudents = true, containerForError) {

    let students = {};
    let allItemsFromStudentsCoursesJunctionTable = await getAllItemsFromStudentsCoursesJunctionTable();
    let allStudentsDictionary = await isolateParticularGroupOfUsersFromAllUsers(containerForError, studentRoleId,
        "Problem z pobraniem studentów z serwera", "student");

    let data = allItemsFromStudentsCoursesJunctionTable.data;
    let studentsAssignedToThisCourse = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item["Courses_id"] == courseId) studentsAssignedToThisCourse.push(item["directus_users_id"]);
    }
    if (data.length == 0) return allStudentsDictionary;
    if (getAssignedStudents == true) { return studentsAssignedToThisCourse; }

    if (studentsAssignedToThisCourse.length == 0) { console.log("nieprzypisano"); return allStudentsDictionary; }

    let thisStudentsIsAssignedToThisCourse = false;

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
        alert(err);
        console.error(`${err}`)
    }
    return response;
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
async function addCourseSetTeachersSelect(containerForSelect, alreadyExistingTeachers) {
    if (alreadyExistingTeachers == 3) {
        return;
    }
    await redirectToIndexIfUserIsNotLoggedInAdmin();

    let teachersDictionary = await isolateParticularGroupOfUsersFromAllUsers(id("add-course-teacher-error"),
        teacherRoleId, "Wystąpił problem z pobieraniem nauczycieli z serwera", "teachers");

    console.log(teachersDictionary);
    // let sectionOfteachers = id("add-course-teacher");

    for (let key in teachersDictionary) {
        let first_name = teachersDictionary[key][0];
        let last_name = teachersDictionary[key][1];
        let email = teachersDictionary[key][2];
        let display = "";

        if (first_name != null && last_name != null) display = first_name + " " + last_name;
        else display = email;

        let option = document.createElement('option');
        option.setAttribute('value', key);
        option.textContent = `${display}`;

        containerForSelect.appendChild(option);

    }
}
async function selectAnotherTeacher(alreadyExistingTeachers, mainContainerId, minorContainerId, prefix) {

    let mainContainer = id(mainContainerId);
    let selectItemNumber = 0;
    let i = 0;

    let containerToShowError = document.createElement("div");
    containerToShowError.setAttribute("class", "error");
    containerToShowError.setAttribute("id", "select-another-teacher-error");
    containerToShowError.textContent = "Nie można dodać więcej niż 3 nauczycieli do kursu";

    while (true) {
        if (id(`${minorContainerId}${i}`) == null) break;
        i++;
    }

    //nie pozwalamy na dodanie wiecej niz trzech nauczycieli do kursu
    selectItemNumber = i;
    if (selectItemNumber + alreadyExistingTeachers < 2) {
        let newSelectElement = document.createElement("select");
        // localStorage.setItem(`new-select-${selectItemNumber}`, "present");
        newSelectElement.setAttribute('id', `${prefix}-select-number-${selectItemNumber}`);
        let br = document.createElement("br");
        br.setAttribute('id', `${prefix}-select-number-${selectItemNumber}-br`);
        mainContainer.appendChild(newSelectElement);
        mainContainer.appendChild(br);

        addCourseSetTeachersSelect(newSelectElement);
        if (document.contains(containerToShowError)) mainContainer.removeChild(containerToShowError);
    }
    else {
        mainContainer.appendChild(containerToShowError);
    }

}
function deleteAdditionalSelects() {
    let i = 0;
    while (true) {
        if (id(`add-course-select-number-${i}`) == null) break;
        else {
            id(`add-course-select-number-${i}`).remove();
            id(`add-course-select-number-${i}-br`).remove();
        }
        i++;
    }
}
const buttonAddAnotherSelectTeacher = id("add-course-add-select-for-another-teacher");
buttonAddAnotherSelectTeacher.onclick = async (e) => {
    e.preventDefault();
    await selectAnotherTeacher(0, "add-course-teacher-selects", "add-course-select-number-", "add-course");
};
async function editCourseSetDefaultValues(courseId = localStorage.getItem("courseIdEdit")) {

    redirectToIndexIfUserIsNotLoggedInAdmin();

    let teachersContainer = id("edit-course-teacher-selects");
    let errorContainer = id("edit-course-all-error");
    let courseDetails = await getCourseDetails(courseId, errorContainer);
    let courseDetailsJson = await courseDetails.json();
    let courseData = courseDetailsJson.data;
    console.log(courseData);

    let nameElement = nameGetter("edit-course-name");
    nameElement[0].placeholder = courseData["name"];
    let nameElementByID = id("edit-course-name");
    nameElementByID.setAttribute('size', courseData["name"].length);

    let maxStudentsCountElem = nameGetter("edit-course-maximum-students-count");
    let maxStudents = courseData["maximum_students_count"];
    maxStudents != null ? maxStudentsCountElem[0].placeholder = maxStudents : maxStudentsCountElem[0].placeholder = "";

    let teachersIDs = await getCourseTeachersAndIdFromCourses_directus_usersTable(courseId);
    let teachersNumber = Object.keys(teachersIDs).length;
    let editCourseFirstSelect = id("edit-course-teacher-default");
    addCourseSetTeachersSelect(editCourseFirstSelect, teachersNumber);

    //pokaż nauczycieli przypisanych do kursu, których można usunąć
    for (let key in teachersIDs) {
        let idInCourses_directus_usersTable = key;
        console.log(idInCourses_directus_usersTable);
        let teacherId = teachersIDs[key];
        let teacherNameSurnameOrEmail = await getTeacherDataById(teacherId);
        console.log(teacherNameSurnameOrEmail);
        //utworz diva z danymi nauczyciela
        let teacherBox = document.createElement('div');
        teacherBox.setAttribute('id', `edit-course-teacher-name-or-surname-${teacherId}`);
        teacherBox.setAttribute('class', `edit-course-teacher-div`);
        teacherBox.textContent = teacherNameSurnameOrEmail;
        //utworz krzyzyk do usuwania juz istniejacych nauczycieli
        let Xbox = document.createElement('button');
        Xbox.setAttribute('id', `edit-course-teacher-${teacherId}-xbox`);
        Xbox.textContent = "X";
        Xbox.addEventListener('click', async function (e, id = idInCourses_directus_usersTable, err = errorContainer) {
            e.preventDefault();
            let deleted = await deleteTeacherFromCourse(id, err, "Nie udało się usunąć wybranego nauczyciela");
            if (deleted) {
                teacherBox.remove();
                teachersNumber -= 1;
                if (document.contains(document.getElementById("select-another-teacher-error"))) {
                    document.getElementById("select-another-teacher-error").remove();
                }
                addCourseSetTeachersSelect(editCourseFirstSelect, teachersNumber);
            }
        })
        teacherBox.appendChild(Xbox);
        teachersContainer.appendChild(teacherBox);

    }
    let buttonAddAnotherSelectTeacher = id("edit-course-add-select-for-another-teacher");
    buttonAddAnotherSelectTeacher.onclick = async (e) => {
        e.preventDefault();
        await selectAnotherTeacher(teachersNumber, teachersContainer.getAttribute('id'), "edit-course-select-number-", "edit-course");
    };



}
async function deleteTeacherFromCourse(itemId, errorContainer, errorMessage) {
    console.log("usuwamy", itemId);
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
async function getCourseTeachersAndIdFromCourses_directus_usersTable(courseId) {
    let errorContainer = id("edit-course-teacher-error");
    let courses = await getAllItemsFromCourses_directus_usersRelationship(errorContainer);
    let coursesJson = await courses.json();
    let thisCourseData = coursesJson.data.filter(n => n.Courses_id == courseId);
    let thisCourseTeachersIDs = {};
    thisCourseData.forEach(function (teacher) {
        thisCourseTeachersIDs[teacher.id] = teacher.directus_users_id;
    });
    return thisCourseTeachersIDs;

}
async function getAllItemsFromCourses_directus_usersRelationship(errorContainer) {
    let response;
    let errorOccured = false;

    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users`, {
            method: 'GET',
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
        errorContainer.textContent = `Nie udało się pobrać nauczycieli przypisanych do kursu`;
    }

    return response;


}
async function getCourseDetails(courseId, errorContainer) {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        console.error(`${err}`);
        errorContainer.textContent = `Nie udało załadować szczegółów kursu`;
    }
    if (!response.ok) errorContainer.textContent = `Nie udało załadować szczegółów kursu`;

    return response;
}
async function courseManager(e, mode, courseId = localStorage.getItem("courseIdEdit")) {

    e.preventDefault();
    console.log(mode);
    await redirectToIndexIfUserIsNotLoggedInAdmin();

    if (mode == "edition") prefix = "edit";
    else {
        prefix = "add";
    }


    let courseNameElement = id(`${prefix}-course-name`);
    let courseDescriptionElement = id(`${prefix}-course-description`);
    let courseMaximumStudentsCountElement = id(`${prefix}-course-maximum-students-count`);
    let mainContainer = id(`${prefix}-course-main-container`);

    let courseTeacherElementDefault = id(`${prefix}-course-teacher-default`);
    let teachersIdsFromSelects = [];
    teachersIdsFromSelects.push(courseTeacherElementDefault.value);

    let i = 0;
    let theSameTeacherSelectedMoreThanOnce = false;
    while (true) {
        if (id(`${prefix}-course-select-number-${i}`) == null) break;
        else {
            teachersIdsFromSelects.push(id(`${prefix}-course-select-number-${i}`).value);
        };
        i++;
    }
    if (mode == "edition") {
        let teachersIdsFromDivs = document.getElementsByClassName("edit-course-teacher-div");
        for (let i = 0; i < teachersIdsFromSelects.length; i++) {
            for (let k = 0; k < teachersIdsFromDivs.length; k++) {
                console.log(teachersIdsFromDivs[k].getAttribute('id'));
                if (teachersIdsFromSelects[i] == teachersIdsFromDivs[k].getAttribute('id').substring(36)) {
                    theSameTeacherSelectedMoreThanOnce = true;
                    break;
                }
            }
        }
    }
    if (!theSameTeacherSelectedMoreThanOnce) {
        for (let i = 0; i < teachersIdsFromSelects.length; i++) {
            for (let k = i + 1; k < teachersIdsFromSelects.length; k++) {
                if (teachersIdsFromSelects[i] == teachersIdsFromSelects[k]) {
                    theSameTeacherSelectedMoreThanOnce = true;
                    break;
                }
            }
        }
    }

    if (theSameTeacherSelectedMoreThanOnce) {
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure error`);
        failure.setAttribute('id', `${prefix}-course-failure-div`);
        failure.textContent = `Nie można dodać tego samego nauczyciela do kursu więcej niż raz`;
        mainContainer.appendChild(failure);
        deleteAdditionalSelects();
        return;
    }
    // console.log(courseNameElement.value)
    // console.log(courseTeacherElement.value)
    // console.log(courseDescriptionElement.value)
    // console.log(courseMaximumStudentsCountElement.value)
    if (mode == "addition") {
        let lastCourseId = await getLastCourseIdFromDatabase();
        let thisCourseId = lastCourseId + 1;

        let valuesToCreateCourse = {
            "id": thisCourseId,
            "name": courseNameElement.value,
            "description": courseDescriptionElement.value,
            "maximum_students_count": courseMaximumStudentsCountElement.value,
            "activity_status": "disabled"
        };
        await addCourse(valuesToCreateCourse, mainContainer, teachersIdsFromSelects, thisCourseId);
    }
}
async function addCourse(valuesToCreateCourse, mainContainer, teachersIdsFromSelects, thisCourseId) {

    let valuesToCreateCourseJson = JSON.stringify(valuesToCreateCourse);

    let response1 = await addCourseToDatabase(valuesToCreateCourseJson, mainContainer);
    let responses = [];
    let responseNotOkayFound = false;
    teachersIdsFromSelects.forEach(async id => {
        console.log('hello');
        console.log(id);
        let response2 = await addTeacherDatabaseManyToManyManager(id, thisCourseId, mainContainer);
        responses.push(response2);
        if (!response2.ok) { responseNotOkayFound = true; }
    });

    console.log(JSON.stringify(response1));

    add_course_form.remove();
    if (response1.ok && (!responseNotOkayFound) && thisCourseId > 0) {
        let success = document.createElement('div');
        success.setAttribute('class', `success`);
        success.setAttribute('id', `add-course-success-div`);
        success.textContent = `Dodano kurs`;
        mainContainer.appendChild(success);
    }
    else {
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `add-course-failure-div`);
        failure.textContent = `Nie udało się dodać kursu`;
        mainContainer.appendChild(failure);
    }

}
async function getLastCourseIdFromDatabase() {
    let response = await getAllCoursesFromDatabase();
    if (!response.ok) {
        id("add-course-all-error").textContent = "Wystąpił problem z pobieraniem danych. Spróbuj później";
        return -1;
    }
    let responseJson = await response.json();
    if (responseJson.data.length == 0) return 0;
    let lastItem = responseJson.data[responseJson.data.length - 1];
    let lastId = lastItem["id"];

    return lastId;

}
async function addCourseToDatabase(valuesToCreateCourseJson, mainContainer) {
    let response;
    console.log(valuesToCreateCourseJson);
    try {
        response = await fetch(`${appAddress}/items/Courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: valuesToCreateCourseJson
        });
    }
    catch (err) {
        console.error(`${err}`);
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `create-course-failure-div`);
        failure.textContent = `Nie udało się dodać kursu`;
        mainContainer.appendChild(failure);
    }

    return response;
}
async function addTeacherDatabaseManyToManyManager(teacherId, courseId, mainContainer) {
    let response;

    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "Courses_id": "${courseId}",
                "directus_users_id": "${teacherId}"
               }`,
        });
    }
    catch (err) {
        console.error(`${err}`);
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `create-course-failure-div`);
        failure.textContent = `Nie udało się przypisać nauczyciela do kursu`;
        mainContainer.appendChild(failure);
    }

    return response;


}
async function addTeacherDatabaseManyToMany() {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: valuesToCreateCourseJson
        });
    }
    catch (err) {
        console.error(`${err}`);
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `create-course-failure-div`);
        failure.textContent = `Nie udało się dodać kursu`;
        mainContainer.appendChild(failure);
    }

    return response;
}


//-----------------------------END OF ADMIN'S PANEL/-----------------------------
