// --------------------selectors--------------------

let id = (id) => document.getElementById(id);
let classes = (classes) => document.getElementsByClassName(classes);

let register_form = id("register-form");
let log_in_form = id("log-in-form");
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
async function logInManager(e) {
    let email = id("email-log-in");
    let password = id("password-log-in");
    let emailErrorLogIn = id("email-log-in-error");
    let passwordErrorLogIn = id("password-log-in-error");

    e.preventDefault();

    let output = true;
    if (!validateEmail(email, emailErrorLogIn)) {
        output = false;
    }
    if (!validatePassword(password, passwordErrorLogIn)) {
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
    wypisz();
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

    if (!validateEmail(email, emailErrorRegister)) {
        output = false;
    }
    if (!validatePassword(password, passwordErrorOneRegister)) {
        output = false;
    }
    if (!validatePassword(password2, passwordErrorTwoRegister)) {
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
    if (inputText.value.match(mailformat)) {
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
    if (myInput.value.length < 8) {
        outputPlace.textContent = "Hasło powinno zawierać co najmniej 8 znaków";
        return false;
    }
    else outputPlace.textContent = "";
    // Validate lowercase letters
    let lowerCaseLetters = /[a-z]/g;
    if (!myInput.value.match(lowerCaseLetters)) {
        outputPlace.textContent = "Hasło powinno zawierać małe litery";
        return false;
    }
    else outputPlace.textContent = "";
    // Validate capital letters
    let upperCaseLetters = /[A-Z]/g;
    if (!myInput.value.match(upperCaseLetters)) {
        outputPlace.textContent = "Hasło powinno zawierać wielkie litery";
        return false;
    }
    else outputPlace.textContent = "";

    // Validate numbers
    let numbers = /[0-9]/g;
    if (!myInput.value.match(numbers)) {
        outputPlace.textContent = "Hasło powinno zawierać liczby";
        return false;
    }
    else outputPlace.textContent = "";


    return true;
}
async function createAccount(email, password, studentAccount = true) {
    let roleId = studentAccount ? studentRoleId : teacherRoleId;

    alert("rola studenta: ", roleId);
    alert("rola tutejsza:", roleId);

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


function checkIfUserIsLoggedIn() {
    if (localStorage.getItem("access_token") === null) return false;
    return true;
}
async function refreshTokenIfExpired() { // zrob funkcje do odswiezania tokenu!
    if (localStorage.getItem("refresh_token") === null) return false;

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
    console.log(JSON.stringify(responseJsonWithNewToken));
    if (!responseWithNewToken.ok) {
        if (responseJsonWithNewToken['errors'][0]['message'] == "Invalid user credentials.") {
            // alert("Sesja wygasła. Zaloguj się ponownie");
            // window.location("/index.html");
            return false;
        }
    }
    console.log(JSON.stringify(responseJsonWithNewToken));
    console.log(localStorage.getItem("refresh_token"));
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
        return false;
    }
    if (checkIfUserIsLoggedIn()) {
        let tokenGotRefreshed = await refreshTokenIfExpired();
        return tokenGotRefreshed;
    }
    return false;
}

async function displayAllUsers() {
    wypisz();
    let userIsLoggedIn = await checkIfUserIsLoggedInAndIfItIsAdmin();
    if (!userIsLoggedIn) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
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
    var mainContainer = id("admin-users-all-users");

    // for (var i = 0; i < data.length; i++) {
    //     const card = document.createElement('div');
    //     card.setAttribute('class', 'card');
    //     const h1 = document.createElement('h1');
    //     h1.textContent = data[i]["email"];
    //     mainContainer.appendChild(card);
    // }

    // // data.forEach(person => {
    // //     const card = document.createElement('div')
    // //     card.setAttribute('class', 'card')
    // //     const h1 = document.createElement('h1')
    // //     h1.textContent = person["email"]
    // //     mainContainer.appendChild(card)
    // // })

    const json = await response.json();
    console.log(json);
    for (var i = 0; i < json.data.length; i++) {
        var person = json.data[i];
        var email = person["email"];
        const card = document.createElement('div');
        card.setAttribute('id', `user-details-email-${person["id"]}`);
        card.textContent = `${email}`;
        mainContainer.appendChild(card);
        // var content = document.createTextNode(`${email}`);
        // document.body.appendChild(content);

    }



}
async function getAllUsersFromDatabase() {
    alert(localStorage.getItem("access_token"));
    let response;
    try {
        response = await fetch(`${appAddress}/users`, {
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



//-----------------------------END OF ADMIN'S PANEL/-----------------------------

