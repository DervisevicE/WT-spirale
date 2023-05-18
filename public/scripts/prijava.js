/*let login = async function(username, password){
    const response = await fetch("/login", {
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({
            username, password
        }),
        method: "POST"
    });
    return response.json();
}
*/
function loginResult(poruka){
    if(poruka.poruka == "Uspješna prijava"){
        window.location.replace("http://localhost:3000/predmeti.html");
    } else{
        alert(poruka.poruka);
    }

}

function onLoginClick() {
    // event.preventDefault();
    var username = document.getElementById("username").value;
    //console.log(username.value)
    var password = document.getElementById("password").value;
    //console.log(password.value);
    /*login(usernameElement.value, passwordElement.value).then(result => {
        console.log(result);
    });*/
    PoziviAjax.postLogin(username, password, loginResult);
}


function logoutResult(poruka){
    document.body.innerHTML = "";
    document.body.innerHTML = "<h1>" + poruka.poruka + "</h1>";
}

function onLogoutClick() {
    PoziviAjax.postLogout(logoutResult);
}
