$(document).ready(() => {
  let uid;
  const db = firebase.firestore();

  $('#login-btn').on('click', e => {
    console.log('click');
    e.preventDefault();
    if (uid) {
      adminLogout();
    } else {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token.
        const token = result.credential.accessToken;
        setCookie('FirebaseGoogleAuthToken', token, 1);
        // The signed-in user info.
        const user = result.user;
        console.log(user);
       });
    }
  });

  firebase.auth().onAuthStateChanged(user => {
    if(user) {
      uid = user.uid;
      getClients();
    }
  });

  function getClients() {
    const clientsRef = db.collection('clients');
    console.log(clientsRef);
    clientsRef.get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        console.log(doc.data());
      });
    });
  }

  function adminLogout () {
    firebase.auth().signOut();
    eraseCookie('FirebaseGoogleAuthToken');
  }
  function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + ";path=/";
  }
  function getCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1,c.length);
          if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
  }
  function eraseCookie(name) {
    console.log('eraseCookie', name);
    document.cookie = name+'=;expires=' + new Date(0).toUTCString() + ';path=/';  
  }
  
});