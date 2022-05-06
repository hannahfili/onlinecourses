// --------------------selectors--------------------

let id = (id) => document.getElementById(id);
let classes = (classes) => document.getElementsByClassName(classes);
let nameGetter = (names) => document.getElementsByName(names);

let register_form = id("register-form");
let log_in_form = id("log-in-form");
let edit_user_form = id("edit-user-form");
let add_user_form = id("add-user-form");
let add_course_form = id("add-course-form");
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
            buttonEditUser.addEventListener('click', function () { saveUserToEditAndRedirect(person) });



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

    buttonToDeleteManyUsers.addEventListener('click', function () { deleteManyUsers(checkboxesElements) });

}
async function deleteManyUsers(checkboxesElements) {
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
function enableDisableButton(checkbox, buttonToDeleteManyUsers) {
    if (checkbox.checked) {
        numberOfBoxesChecked += 1;
        buttonToDeleteManyUsers.classList.remove("disabled");
    }
    else {
        numberOfBoxesChecked -= 1;
        if (numberOfBoxesChecked < 1) {
            buttonToDeleteManyUsers.classList.add("disabled");
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
    // await redirectToIndexIfUserIsNotLoggedInAdmin();

    let firstName = localStorage.getItem("edit_user_firstName");
    let lastName = localStorage.getItem("edit_user_lastName");
    let email = localStorage.getItem("edit_user_email");

    let firstNameElement = nameGetter("edit-user-first-name");
    let lastNameElement = nameGetter("edit-user-last-name");
    let emailElement = nameGetter("edit-user-email");
    // let passwordElementOne = nameGetter("edit-user-password");
    // let passwordElementTwo = nameGetter("edit-user-password-2");


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
                // DODAĆ OPCJĘ WYŚWIETLANIA NAUCZYCIELI
                let teachers = await getTeachersDataToDisplay(course["teacher"]);
                let description = course["description"];



                const row = document.createElement('tr');

                const courseBox = document.createElement('td');
                courseBox.setAttribute('id', `course-details-name-${course["id"]}`);
                courseBox.textContent = `${name}`;
                row.appendChild(courseBox);

                console.log(teachers);
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




                mainContainer.appendChild(row);

                // const editBox = document.createElement('td');
                // editBox.setAttribute('id', `user-details-editbox-user-${course["id"]}`);

                // const buttonEditUser = document.createElement('button');
                // buttonEditUser.setAttribute('id', `button-admin-users-edit-user-${course["id"]}`);
                // buttonEditUser.setAttribute('class', `btn btn-secondary`);
                // buttonEditUser.textContent = "Edytuj dane";
                // buttonEditUser.addEventListener('click', function () { saveUserToEditAndRedirect(course) });
                // editBox.appendChild(buttonEditUser);
                // row.appendChild(editBox);

                // const deleteBox = document.createElement('td');
                // deleteBox.setAttribute('id', `user-details-deletebox-user-${course["id"]}`);

                // const buttonDeleteUser = document.createElement('button');
                // buttonDeleteUser.setAttribute('id', `button-admin-users-delete-user-${course["id"]}`);
                // buttonDeleteUser.setAttribute('class', `btn btn-secondary`);
                // buttonDeleteUser.textContent = "Usuń użytkownika";
                // buttonDeleteUser.addEventListener('click', function () { deleteManager(course) });
                // deleteBox.appendChild(buttonDeleteUser);
                // row.appendChild(deleteBox);

                // const roleBox = document.createElement('td');
                // roleBox.setAttribute('id', `user-details-rolebox-user-${course["id"]}`);

                // if (course["role"] != teacherRoleId) {
                //     const buttonBestowTeacherRoleUponPerson = document.createElement('button');
                //     buttonBestowTeacherRoleUponPerson.setAttribute('id', `button-admin-users-bestow-teacher-role-${course["id"]}`);
                //     buttonBestowTeacherRoleUponPerson.setAttribute('class', `btn btn-secondary btn-success`);
                //     buttonBestowTeacherRoleUponPerson.textContent = "Nadaj rolę nauczyciela";

                //     buttonBestowTeacherRoleUponPerson.addEventListener('click', function () { updateUserData(course["id"], "role", teacherRoleId, "bestow teacher role") });
                //     roleBox.appendChild(buttonBestowTeacherRoleUponPerson);
                // }
                // else {
                //     const buttonCancelTeacherRoleUponPerson = document.createElement('button');
                //     buttonCancelTeacherRoleUponPerson.setAttribute('id', `button-admin-users-cancel-teacher-role-${course["id"]}`);
                //     buttonCancelTeacherRoleUponPerson.setAttribute('class', `btn btn-secondary`);
                //     buttonCancelTeacherRoleUponPerson.textContent = "Odbierz rolę nauczyciela";

                //     buttonCancelTeacherRoleUponPerson.addEventListener('click', function () { updateUserData(course["id"], "role", studentRoleId, "cancel teacher role") });
                //     roleBox.appendChild(buttonCancelTeacherRoleUponPerson);
                // }
                // row.appendChild(roleBox);

                // const checkboxBox = document.createElement('td');
                // checkboxBox.setAttribute('id', `user-details-checkbox-user-${course["id"]}`);

                // const checkbox = document.createElement('input');
                // checkbox.setAttribute('id', `checkbox-admin-users-${course["id"]}`);
                // checkbox.setAttribute('class', `form-check-input`);
                // checkbox.setAttribute('type', 'checkbox');
                // checkbox.addEventListener('click', function () { enableDisableButton(this, buttonToDeleteManyUsers) });
                // checkboxesElements[`${course["id"]}`] = checkbox;
                // checkboxBox.appendChild(checkbox);

                // row.appendChild(checkboxBox);

                // mainContainer.appendChild(row);
            })(i);
            //dopisz - wyswietlanie kursów jak już dodasz chociaż jeden
        }


    }
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
async function isolateTeachersFromAllUsers(containerToDisplayError) {
    let response = await getAllUsersFromDatabase();
    let responseJson = await response.json();
    if (!response.ok) {
        containerToDisplayError.textContent = "Wystąpił problem z pobieraniem nauczycieli z serwera";
    }
    let users = responseJson.data;
    let teachersDictionary = {};

    for (let i = 0; i < users.length; i++) {
        let obj = users[i];
        if (obj["role"] == teacherRoleId) {
            let teacherData = [obj["first_name"], obj["last_name"], obj["email"]];
            teachersDictionary[obj["id"]] = teacherData;
        }
    }
    return teachersDictionary;
}
async function addCourseSetTeachersSelect(containerForSelect) {
    // for (key in localStorage) {
    //     if (key.substring(0, 11) == 'new-select-') {
    //         localStorage.removeItem(key);
    //     }
    // }
    await redirectToIndexIfUserIsNotLoggedInAdmin();

    let teachersDictionary = await isolateTeachersFromAllUsers(id("add-course-teacher-error"));

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
async function selectAnotherTeacher() {
    let mainContainer = id("add-course-teacher-selects");
    let selectItemNumber = 0;
    let i = 0;

    while (true) {
        if (id(`add-course-select-number-${i}`) == null) break;
        i++;
    }

    //nie pozwalamy na dodanie wiecej niz trzech nauczycieli do kursu
    selectItemNumber = i;
    if (selectItemNumber < 2) {
        let newSelectElement = document.createElement("select");
        localStorage.setItem(`new-select-${selectItemNumber}`, "present");
        newSelectElement.setAttribute('id', `add-course-select-number-${selectItemNumber}`);
        let br = document.createElement("br");
        br.setAttribute('id', `add-course-select-number-${selectItemNumber}-br`);
        mainContainer.appendChild(newSelectElement);
        mainContainer.appendChild(br);

        addCourseSetTeachersSelect(newSelectElement);
    }
    else {
        let containerToShowError = document.createElement("div");
        containerToShowError.setAttribute("class", "error");
        containerToShowError.textContent = "Nie można dodać więcej niż 3 nauczycieli do kursu";
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
    await selectAnotherTeacher();
};
async function courseManager(e, mode) {

    e.preventDefault();
    await redirectToIndexIfUserIsNotLoggedInAdmin();

    if (mode == "edition") prefix = "edit";
    else {
        prefix = "add";
    }


    let courseNameElement = id(`${prefix}-course-name`);
    let courseDescriptionElement = id(`${prefix}-course-description`);
    let courseMaximumStudentsCountElement = id(`${prefix}-course-maximum-students-count`);
    let mainContainer = id("add-course-main-container");

    let courseTeacherElementDefault = id(`${prefix}-course-teacher-default`);
    let manyTeachersIds = [];
    manyTeachersIds.push(courseTeacherElementDefault.value);

    let i = 0;
    while (true) {
        if (id(`add-course-select-number-${i}`) == null) break;
        else {
            manyTeachersIds.push(id(`add-course-select-number-${i}`).value);
        };
        i++;
    }
    console.log(manyTeachersIds);
    let theSameTeacherSelectedMoreThanOnce = false;
    for (let i = 0; i < manyTeachersIds.length; i++) {
        for (let k = i + 1; k < manyTeachersIds.length; k++) {
            if (manyTeachersIds[i] == manyTeachersIds[k]) {
                theSameTeacherSelectedMoreThanOnce = true;
                break;
            }
        }
    }
    if (theSameTeacherSelectedMoreThanOnce) {
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `create-course-failure-div`);
        failure.textContent = `Nie można dodać tego samego nauczyciela do kursu więcej niż raz`;
        mainContainer.appendChild(failure);
        deleteAdditionalSelects();
        return;
    }
    // console.log(courseNameElement.value)
    // console.log(courseTeacherElement.value)
    // console.log(courseDescriptionElement.value)
    // console.log(courseMaximumStudentsCountElement.value)



    let lastCourseId = await getLastCourseIdFromDatabase();
    let thisCourseId = lastCourseId + 1;

    let valuesToCreateCourse = {
        "id": thisCourseId,
        "name": courseNameElement.value,
        "description": courseDescriptionElement.value,
        "maximum_students_count": courseMaximumStudentsCountElement.value,
        "activity_status": "disabled"
    };
    let valuesToCreateCourseJson = JSON.stringify(valuesToCreateCourse);

    let response1 = await addCourseToDatabase(valuesToCreateCourseJson, mainContainer);
    let responses = [];
    let responseNotOkayFound = false;
    manyTeachersIds.forEach(async id => {
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
        success.setAttribute('id', `create-course-success-div`);
        success.textContent = `Dodano kurs`;
        mainContainer.appendChild(success);
    }
    else {
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `create-course-failure-div`);
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
