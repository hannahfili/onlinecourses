import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers
} from './general-script.js';
let register_form = id("register-form");
if (register_form) {
    register_form.addEventListener("submit", function (e) {
        registerManager(e);
    });
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