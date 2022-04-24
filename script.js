// --------------------selectors--------------------

let id = (id) => document.getElementById(id);

let classes = (classes) => document.getElementsByClassName(classes);

let email = id("email");
let password = id("password");
let password2 = id("password-2");
let register_form = id("register-form");
let log_in_form = id("log-in-form");
let emailErrorRegister = id("email-error");
let passwordErrorOneRegister = id("password-error");
let passwordErrorTwoRegister = id("password2-error");
let emailErrorLogIn = id("email-log-in-error");
let passwordErrorLogIn = id("password-log-in-error");
let access_token = "";
let refresh_token = "";
let loggedInEmail = "";
let loggedInPassword = "";
let loggedInRole = "";
let loggedInPlatformAccessTimeout = "";
// --------------------END OF selectors--------------------

// --------------------roles' IDs--------------------
const appAddress = "https://3qyn4234.directus.app";
const studentRoleId = "063a370c-d078-44bf-b803-a84e72ca2255";
const teacherRoleId = "f3886bec-904f-4e69-82c6-31f3735f0e7b";
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
    email = id("email-log-in");
    password = id("password-log-in");
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
        if (response.ok) {
            const responseJson = await response.json();
            //get users data: roleId

            await getLoggedUserData(email.value, password.value, responseJson);
            //window.location = "main.html";
        }
        else {
            console.log("error");
        }
    }
}
async function getLoggedUserData(email, password, responseJson) {
    loggedInEmail = email;
    loggedInPassword = password;
    access_token = responseJson["data"]["access_token"];
    console.log(access_token);
    refresh_token = responseJson["data"]["refresh_token"];
    let response;
    try {
        response = await fetch(`${appAddress}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            }
        });
        const responseJson = await response.json();
        loggedInRole = responseJson["data"]["role"];
        loggedInPlatformAccessTimeout = responseJson["data"]["Platform_access_timeout"];
    }
    catch (err) {
        console.error(`${err}`);
    }
    wypisz();

}
function wypisz() {
    console.log(loggedInEmail);
    console.log(loggedInPassword);
    console.log(access_token);
    console.log(refresh_token);
    console.log(loggedInRole);
    console.log(loggedInPlatformAccessTimeout);
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
function validateData() {
    let output = true;
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
    let output = validateData();

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
    if (studentAccount) roleId = studentRoleId;
    else roleId = teacherRoleId;
    console.log(email);
    console.log(password);
    console.log(roleId);

    let response;
    const date = new Date();
    let futureDate = new Date(date.setDate(date.getDate() + 30));
    let dateStr = JSON.stringify(futureDate);
    console.log(dateStr);
    try {
        response = await fetch(`${appAddress}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{
           "email": "${email}",
           "password": "${password}",
           "role": "${roleId}",
           "Platform_access_timeout": ${dateStr}
          }`,
        });
    }
    catch (err) {
        console.error(`${err}`)
    }



    return response;

}
