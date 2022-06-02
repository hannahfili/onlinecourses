import {
    id, classes, nameGetter, appAddress, studentRoleId, teacherRoleId, adminRoleId,
    validateEmail, validatePassword, logOut, redirectToIndexIfUserIsNotLoggedInAdmin,
    checkIfUserIsLoggedInAndIfItIsAdmin, getAllUsersFromDatabase, enableDisableButton,
    isolateParticularGroupOfUsersFromAllUsers, getAllCoursesFromDatabase, getCourseDetails,
    getStudentsFromStudentsCoursesJunctionTable, getAllItemsFromStudentsCoursesJunctionTable,
    updateCourse, getSectionsAssignedToTheModule, getAllSections, checkIfElementOccursInArrayMoreThanOnce,
    getTeachersDataToDisplay, getModulesAssignedToThisCourse, getAllModules, deleteTeacherFromCourse,
    addFileElementManager, checkIfUserIsLoggedIn, refreshToken, getUserInfo, updateUserData
} from './general-script.js';
import {
    displayUpperInfo, displayWeekTimetable, setMondayAndSaturdayForThisWeek, displayDate, addMeeting,
    getStartTime, getEndTime
} from './teacher-panel-script.js';


let leftArrowClicked = 0;
let rightArrowClicked = 0;

window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInStudent();
    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    console.log(userInfo);
    let pageName = id("student-panel-page-name");
    let nameTextNode = document.createTextNode(`${userInfo["email"]}`);
    pageName.appendChild(nameTextNode);

    let profileAccessTimeout=id("student-panel-page-access-timeout");
    let timeLeft = new Date(userInfo.platform_access_timeout).getTime()-new Date().getTime();
    let timeLeftInDays = timeLeft / (1000 * 3600 * 24);


    let accessTimeoutTextNode=document.createTextNode("Masz "+parseInt(timeLeftInDays)+" dni dostępu do platformy");
    profileAccessTimeout.appendChild(accessTimeoutTextNode);

    let divForSettingMeetings = id("student-panel-set-meetings-div");
    let divForTimetable = id("student-panel-week-timetable");
    let divForWeekData = id("student-panel-week-name");
    let divForSelectTeacher = id("student-panel-select-teacher-div");
    let selectTeacherElement = id("student-panel-select-teacher-to-meet");
    // let divForShiftForm = id("teacher-panel-shift-form");


    let weekStartEnd = setMondayAndSaturdayForThisWeek();
    // console.log(localStorage.getItem("setMainContainerToShiftForm"));

    if (localStorage.getItem("setMainContainerToSetMeeting") == "true") {
        // divForTable.remove();
        // divForTable.style.visibility="visible";
        localStorage.setItem("setMainContainerToSetMeeting", false);
        await chooseTeacherAndSetMeeting(divForTimetable, divForWeekData, weekStartEnd, divForSelectTeacher, selectTeacherElement);
    }
    else if (localStorage.getItem("setMainContainerToDeposits") == "true") {
        divForSettingMeetings.remove();
        localStorage.setItem("setMainContainerToDeposits", false);
        await setMainContainerToDeposits("student-panel");
    }


    let buttonToSetMeetingWithTeacher = id("student-panel-set-meeting-button");
    buttonToSetMeetingWithTeacher.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToSetMeeting", true);
        window.location.reload();
    });

    let buttonMainMenu = id("student-panel-main-menu");
    buttonMainMenu.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToSetMeeting", false);
        window.location = "studentPanel.html";
    });

    let buttonMyDeposits = id("student-panel-check-deposit-button");
    buttonMyDeposits.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToDeposits", true);
        window.location.reload();
    });
    let buttonToLogOut=id("student-panel-log-out");
    buttonToLogOut.addEventListener('click', async function (e) {
        e.preventDefault();
        await logOut();
        window.location="index.html";
    });

});
async function setMainContainerToDeposits(filePrefix, userId = localStorage.getItem("loggedInUserId")) {
    let myDepositsMainDiv = id(`${filePrefix}-my-deposits`);
    myDepositsMainDiv.style.visibility = "visible";

    let myDepositsTBody=id("student-panel-my-deposits-table-all-transfers");

    await displayUserDepositsUpperPanel(userId, filePrefix);
    console.log('HEELOOOO');

    let thisUserBankTransfers=await getUserBankTransfertFromDatabase(userId);
    thisUserBankTransfers.sort(function(a,b){
        const date1 = new Date(a.transfer_datetime);
        const date2 = new Date(b.transfer_datetime);
    
    return date1 - date2;
    });
    console.log(thisUserBankTransfers);

    for(let i=0; i<thisUserBankTransfers.length; i++){

        let transfer=thisUserBankTransfers[i];
        let receiverInfo=await getUserInfo(transfer.receiver);
        let receiverEmail=receiverInfo.email;

        let senderInfo=await getUserInfo(transfer.sender);
        let senderEmail=senderInfo.email;

        let datetime=transfer.transfer_datetime;
        let datetimeToDisplay=displayDateTime(datetime);

        let title=transfer.transfer_title;



        let tr=document.createElement('tr');
        tr.setAttribute('id', `${filePrefix}-tr-${i}`);

        let tdForDateTime=document.createElement('td');
        tdForDateTime.setAttribute('id', `${filePrefix}-td-datetime-${i}`);
        tdForDateTime.textContent=datetimeToDisplay;
        tr.appendChild(tdForDateTime);

        let tdForTitle=document.createElement('td');
        tdForTitle.setAttribute('id', `${filePrefix}-td-title-${i}`);
        tdForTitle.textContent=title;
        tr.appendChild(tdForTitle);

        let tdForSender=document.createElement('td');
        tdForSender.setAttribute('id', `${filePrefix}-td-sender-${i}`);
        
        let tdForReceiver=document.createElement('td');
        tdForReceiver.setAttribute('id', `${filePrefix}-td-receiver-${i}`);
        
        if(senderEmail!=receiverEmail){
         if(senderInfo.id==userId){
             tdForSender.textContent='';
             tdForReceiver.textContent=receiverEmail;
             tr.style.backgroundColor = "red";

         }
         else if(receiverInfo.id==userId){
             tdForSender.textContent=senderEmail;
             tdForReceiver.textContent='';
         }   
        }
        else{
            tdForSender.textContent=senderEmail;
            tdForReceiver.textContent='';
            tr.style.backgroundColor = "green";
        }

        tr.appendChild(tdForSender);
        tr.appendChild(tdForReceiver);

        let tdForSum=document.createElement('td');
        tdForSum.setAttribute('id', `${filePrefix}-td-sum-${i}`);

        if(receiverInfo.id==userId) tdForSum.textContent=transfer.value;
        else tdForSum.textContent="-"+transfer.value;
        tr.appendChild(tdForSum);


        myDepositsTBody.appendChild(tr);



    }




}
async function getUserBankTransfertFromDatabase(userId){
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Bank_transfers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    let responseJson = await response.json();
    let responseData = responseJson.data;
    // console.log(responseData);
    let thisUserBankTransfers = responseData.filter(n => n.sender == userId || n.receiver==userId);
    return thisUserBankTransfers;
}
async function displayUserDepositsUpperPanel(studentId, filePrefix) {
    let userInfo = await getUserInfo(studentId);
    let balance = userInfo.balance;
    let platform_access_timeout = userInfo.platform_access_timeout;
    let timeoutDisplay = displayDateTime(platform_access_timeout);

    let balancePlace = id(`${filePrefix}-my-deposits-my-balance`);
    balancePlace.textContent = `Bieżące saldo: ${balance == null ? 0 : balance} PLN`;

    let platform_access_timeout_Place = id(`${filePrefix}-my-deposits-platform-access-timeout`);
    platform_access_timeout_Place.textContent = "Data ważności konta: " + timeoutDisplay;

    let buttonToProlongPlaftormAccess = id(`${filePrefix}-prolong-platform-access-timeout`);
    let buttonToTopUpAccount = id(`${filePrefix}-top-up-account`);

    buttonToProlongPlaftormAccess.addEventListener('click', async function (e) {
        e.preventDefault();
        let prolonged = await prolongAccess(studentId);
    });
    buttonToTopUpAccount.addEventListener('click', async function (e) {
        e.preventDefault();
        platform_access_timeout_Place.remove()
        let toppedUp = await topUpAccountManager(studentId, buttonToTopUpAccount, filePrefix);
    });

}
async function topUpAccountManager(userId, button, filePrefix) {

    let userInfo = await getUserInfo(userId);
    let userBalance = userInfo.balance;
    if (userBalance == null) userBalance = 0;
    userBalance=Number(userBalance);
    console.log(userBalance);

    let divForChoosingAmountOfMoney = document.createElement('div');

    let label10 = document.createElement("label");
    label10.textContent = "10 zł"
    divForChoosingAmountOfMoney.appendChild(label10);

    let pln10 = document.createElement("input");
    // pln10.type="radio";
    pln10.setAttribute('type', 'radio');
    pln10.setAttribute('name', 'money-select');
    pln10.setAttribute('id', `${filePrefix}-top-up-account-radio-10-pln`);
    pln10.value = 10;
    divForChoosingAmountOfMoney.appendChild(pln10);

    let label20 = document.createElement("label");
    label20.textContent = "20 zł"

    divForChoosingAmountOfMoney.appendChild(label20);

    let pln20 = document.createElement("input");
    // pln20.type="radio";
    pln20.setAttribute('type', 'radio');
    pln20.setAttribute('name', 'money-select');
    pln20.setAttribute('id', `${filePrefix}-top-up-account-radio-20-pln`);
    pln20.value = 20;

    divForChoosingAmountOfMoney.appendChild(pln20);

    let label50 = document.createElement("label");
    label50.textContent = "50 zł"

    divForChoosingAmountOfMoney.appendChild(label50);

    let pln50 = document.createElement("input");
    // pln50.type="radio";

    pln50.setAttribute('type', 'radio');
    pln50.setAttribute('name', 'money-select');
    pln50.setAttribute('id', `${filePrefix}-top-up-account-radio-50-pln`);
    pln50.value = 50;
    divForChoosingAmountOfMoney.appendChild(pln50);


    let label100 = document.createElement("label");
    label100.textContent = "100 zł";

    divForChoosingAmountOfMoney.appendChild(label100);

    let pln100 = document.createElement("input");
    // pln100.type="radio";

    pln100.setAttribute('type', 'radio');
    pln100.setAttribute('name', 'money-select');
    pln100.setAttribute('id', `${filePrefix}-top-up-account-radio-100-pln`);
    pln100.value = 100;

    divForChoosingAmountOfMoney.appendChild(pln100);


    let submitButton = document.createElement('button');
    submitButton.setAttribute('id',`${filePrefix}-top-up-account-submit-button`);
    submitButton.textContent='Zatwierdź';
    divForChoosingAmountOfMoney.appendChild(submitButton);
    
    button.after(divForChoosingAmountOfMoney);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let value = pln10.checked ? pln10.value : pln20.checked ? pln20.value : pln50.checked ? pln50.value : pln100.checked ? pln100.value : null;
        if (value != null) {
            let transferMade = await makeTransferManager(userId, value, "Doładowanie konta", displayDate(new Date(), true, true), userId);
            if (transferMade) {
                let updated = await updateUserData(userId, "balance", Number(userBalance+Number(value)), "doładowanie konta");
                if (updated) {
                    alert('Pomyślnie doładowano konto');

                    localStorage.setItem("setMainContainerToDeposits", true);
                    window.location.reload();
                }

            }
        }
        else{
            let errorContainer=document.createElement('div');
            errorContainer.setAttribute('id', `${filePrefix}-top-up-account-error-place`);
            errorContainer.setAttribute('class', `error`);
            errorContainer.textContent='Zaznacz wartość!';
            divForChoosingAmountOfMoney.appendChild(errorContainer);
        }
    });

    // let transferMade=await makeTransferManager(userId, 10, "Przedłużenie ważności konta", datetime, userId);
}
async function prolongAccess(userId) {
    let confirmed = confirm('Czy na pewno chcesz wydłużyć ważność konta? Wiąże się to z wpłatą 10zł');
    if (!confirmed) return false;
    let date = new Date();
    let datetime = displayDate(date, true, true);

    let userInfo = await getUserInfo(userId);
    let oldDate = userInfo.platform_access_timeout;
    let oldDateAsDate = new Date(oldDate);
    let newTimeout = new Date(oldDateAsDate.setDate(oldDateAsDate.getDate() + 30));


    console.log(datetime);
    // let newDate=new Date(oldDate.get);
    console.log(newTimeout);
    // await updateUserData(userId, "platform_access_timeout", displayDate(newTimeout,true,true,
    //     "prolonging_platfrom_access_timetour"));


    let transferMade = await makeTransferManager(userId, 10, "Przedłużenie ważności konta", datetime, userId);
    if (transferMade) {
        let updated = await updateUserData(userId, "platform_access_timeout", displayDate(newTimeout, true, true));
        if (updated) {
            alert('Pomyślnie przedłużono ważność konta');

            localStorage.setItem("setMainContainerToDeposits", true);
            window.location.reload();

        }
        else alert('BŁĄD SERWERA. Nie udało się przedłużyć ważności konta!')

    }
}
function displayDateTime(datetime) {
    let Tindex = String(datetime).search("T");
    let dateOnly = String(datetime).substring(0, Tindex);
    let dateDisplay = displayDate(new Date(dateOnly));
    let timeOnly = String(datetime).substring(Tindex + 1, String(datetime).length - 3);

    let dateTimeDisplay = dateDisplay + " " + timeOnly;
    return dateTimeDisplay;

}
function setHowManyWeeksToAdd() {
    if (leftArrowClicked == rightArrowClicked) return 0;
    let rightNumber = rightArrowClicked;
    let leftNumber = -leftArrowClicked;
    return rightNumber + leftNumber;

}
async function setMeetingWithTeacherAddTeachersSelectOptions(containerForSelect, errorContainer) {


    let teachersDictionary = await isolateParticularGroupOfUsersFromAllUsers(errorContainer,
        teacherRoleId, "Wystąpił problem z pobieraniem nauczycieli z serwera", "teachers");

    console.log(teachersDictionary);
    // let sectionOfteachers = id("add-course-teacher");
    let option = document.createElement('option');
    option.setAttribute('value', 'none');
    option.textContent = "-";

    containerForSelect.appendChild(option);

    for (let key in teachersDictionary) {
        let first_name = teachersDictionary[key][0];
        let last_name = teachersDictionary[key][1];
        let email = teachersDictionary[key][2];
        let display = "";

        if (first_name != null && last_name != null) display = first_name + " " + last_name;
        else display = email;

        option = document.createElement('option');
        option.setAttribute('value', key);
        option.textContent = `${display}`;

        containerForSelect.appendChild(option);

    }


}
async function chooseTeacherAndSetMeeting(divForTable, divForWeekData, weekStartEnd, divForSelectTeacher, selectTeacherElement) {
    let errorContainer = id("student-panel-select-teacher-to-meet-error");
    divForSelectTeacher.style.visibility = "visible";
    await setMeetingWithTeacherAddTeachersSelectOptions(selectTeacherElement);
    let submitButton = id("student-panel-select-teacher-to-meet-submit-button");
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        if (selectTeacherElement.value != "none") {
            showTeachersCalendar(divForTable, divForWeekData, weekStartEnd, selectTeacherElement.value);
            errorContainer.textContent = '';
        }
        else errorContainer.textContent = "Musisz wybrać nauczyciela, aby sprawdzić grafik";
    });

    //    await 

}
async function showTeachersCalendar(divForTable, divForWeekData, weekStartEnd, teacherId) {
    console.log("RIGHT: ", rightArrowClicked);
    console.log("LEFT: ", leftArrowClicked);

    divForTable.style.visibility = "visible";
    displayUpperInfo(divForWeekData, weekStartEnd);
    setWeekdaysDates(weekStartEnd);
    console.log(teacherId);

    let buttonsIds = id("student-panel-shift-choice-button-");

    await displayWeekTimetable(weekStartEnd, document.querySelectorAll(".student-panel-week-day-indicator"),
        "student-panel-timetable-", teacherId, true);

    let buttonDisplayNextWeek = id("student-panel-next-week-button");
    buttonDisplayNextWeek.addEventListener('click', async function (e) {
        console.log("RIGHT: ", rightArrowClicked);
        console.log("LEFT: ", leftArrowClicked);
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        rightArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd();
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(".student-panel-week-day-indicator"), "student-panel-timetable-", teacherId, true);

    });

    let buttonDisplayPreviousWeek = id("student-panel-previous-week-button");
    buttonDisplayPreviousWeek.addEventListener('click', async function (e) {
        console.log("RIGHT: ", rightArrowClicked);
        console.log("LEFT: ", leftArrowClicked);
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        leftArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd();
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(".student-panel-week-day-indicator"), "student-panel-timetable-", teacherId, true);

    });



}
function setWeekdaysDates(weekStartEnd) {

    let weekdays = document.querySelectorAll(".student-panel-week-day");
    // console.log(weekdays);
    let startMonday = weekStartEnd["monday_date"];
    // let weekdaysArray=[...]
    for (let i = 0; i < weekdays.length; i++) {
        let newDate = startMonday.getTime() + i * 86400000;
        let dateToDisplay = new Date(newDate);
        let dateToDisplayAsString = displayDate(dateToDisplay);


        let newDateDiv = document.createElement("div");
        newDateDiv.setAttribute("id", `student-panel-text-node-with-date-${i}`);
        newDateDiv.textContent = dateToDisplayAsString;

        let oldDateDiv = id(`student-panel-text-node-with-date-${i}`);
        if (oldDateDiv) oldDateDiv.remove();

        weekdays[i].appendChild(newDateDiv);
        // weekdays[i].textContent+=dateToDisplayAsString;
    }


}
async function redirectToIndexIfUserIsNotLoggedInStudent() {
    let userIsLoggedAndTeacher = await checkIfUserIsLoggedInStudent();
    if (!userIsLoggedAndTeacher) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
async function checkIfUserIsLoggedInStudent() {
    if (!checkIfUserIsStudent()) {
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
function checkIfUserIsStudent() {
    if (localStorage.getItem("loggedInRole") == studentRoleId) return true;
    return false;
}
async function addMeetingManager(startHourIndex, dateNotParsed, teacherId) {

    let startTime = getStartTime(startHourIndex);
    let endTime = getEndTime(startHourIndex);



    let mainContainer = id("student-panel-main-container");

    let timetableContainer = id("student-panel-set-meetings-div");
    timetableContainer.remove();

    let divForInput = document.createElement("div");
    divForInput.setAttribute("id", "student-panel-set-topic-div");

    let divForMeetingDetails = document.createElement("div");
    divForMeetingDetails.setAttribute("id", "student-panel-set-topic-meeting-details");
    divForMeetingDetails.textContent = `${displayDate(dateNotParsed)} | ${startTime} - ${endTime}`;
    divForInput.appendChild(divForMeetingDetails);


    let labelForTopic = document.createElement("label");
    labelForTopic.textContent = "Podaj temat spotkania:";
    divForInput.appendChild(labelForTopic);


    let topicInput = document.createElement("input");
    topicInput.type = "text";
    topicInput.maxLength = "100";
    topicInput.required = "required";
    divForInput.appendChild(topicInput);



    let submitButton = document.createElement("button");
    submitButton.setAttribute("id", "student-panel-set-topic-submit-button");
    submitButton.textContent = "Zatwierdź temat";
    divForInput.appendChild(submitButton);

    let errorContainer = document.createElement("div");
    errorContainer.setAttribute("id", "student-panel-set-topic-error");
    errorContainer.setAttribute("class", "error");
    divForInput.appendChild(errorContainer);

    let meetingAdded = false;
    let transferMade = false;

    mainContainer.appendChild(divForInput);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        if (divForInput != "") {
            let confirmed = confirm("Czy na pewno chcesz umówić spotkanie? Opłata: 50 PLN");
            if (confirmed) {
                transferMade = await makeTransferManager(teacherId, 50.0, topicInput.value, displayDate(dateNotParsed, true, true));
                if (transferMade) {
                    meetingAdded = await addMeeting(startHourIndex, dateNotParsed, topicInput.value, teacherId);
                    if (meetingAdded) {
                        alert(`Pomyślnie dodano spotkanie! Szczegóły: data: ${displayDate(dateNotParsed)}, godzina: ${getStartTime(startHourIndex)}, temat: ${topicInput.value}`);


                    }
                    else alert('BŁĄD SERWERA. Nie udało się umówić spotkania');
                }
                localStorage.setItem("setMainContainerToSetMeeting", true);
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();

            }

        }
        else errorContainer.textContent = "Temat spotkania jest wymagany!";
    })




}
async function makeTransferManager(receiver, amountOfMoney, title, dateTime, sender = localStorage.getItem("loggedInUserId")) {
    let moneyTakenFromSender = false;
    let moneyGivenToReceiver = false;
    let senderInfo = await getUserInfo(sender);
    let senderBalance = senderInfo.balance;
    if (senderBalance == null) senderBalance = 0;
    senderBalance=Number(senderBalance);

    let receiverInfo = await getUserInfo(receiver);
    let receiverBalance = receiverInfo.balance;
    if (receiverBalance == null) receiverBalance = 0;
    receiverBalance=Number(receiverBalance);

    let makeTransferPossible = false;
    let accountUpdated = false;

    if (receiver != sender) {
        let senderHasEnoughMoney = await checkSenderBalance(sender, amountOfMoney);
        if (!senderHasEnoughMoney) {
            alert('Nie masz wystarczających środków na koncie, aby umówić spotkanie!');
            return false;
        }
        moneyTakenFromSender = await updateUserData(sender, "balance", senderBalance - amountOfMoney, "balance");
        moneyGivenToReceiver = await updateUserData(receiver, "balance", receiverBalance + amountOfMoney, "balance");
        if (moneyGivenToReceiver && moneyTakenFromSender) makeTransferPossible = true;
    }
    else {
        accountUpdated = await updateUserData(receiver, "balance", receiverBalance + amountOfMoney, "balance");

        if (accountUpdated) makeTransferPossible = true;
    }
    if (makeTransferPossible) {
        let transferDone = await makeTransfer(receiver, amountOfMoney, title, dateTime, sender);

        if (transferDone) return true;
        else {
            alert('BŁĄD SERWERA. Nie udało się zrobić przelewu');
            return false;
        }
    }



}
async function checkSenderBalance(senderId, moneySenderWantsToPay) {
    let studentInfo = await getUserInfo(senderId);
    let balance = Number(studentInfo.balance);
    if (moneySenderWantsToPay <= balance) return true;
    return false;
}
async function makeTransfer(receiver, amountOfMoney, title, dateTime, sender) {
    console.log("ROBIE PRZELEW");
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let dataToPost = {
        "transfer_title": title,
        "transfer_datetime": dateTime,
        "sender": sender,
        "receiver": receiver,
        "value": amountOfMoney
    };
    let dataToPostJson = JSON.stringify(dataToPost);
    try {
        response = await fetch(`${appAddress}/items/Bank_transfers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPostJson
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
export {
    showTeachersCalendar, addMeetingManager
}