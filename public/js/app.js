let auth0 = null;

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
	audience: config.audience
  });
};

window.onload = async () => {
  await configureClient();
  
  updateUI();
  
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
	try {
		// Process the login state
		await auth0.handleRedirectCallback();
		console.log("Logged in");
	} catch (err){
		console.log("Error logging in on line 36: ", err);
	}	
		updateUI();
		// Use replaceState to redirect the user away and remove the querystring parameters
		window.history.replaceState({}, document.title, "/");
  }
};

const updateUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;
  document.getElementById("btn-call-api").disabled = !isAuthenticated;
  if (isAuthenticated) {
    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = await auth0.getTokenSilently();
	
	//obtain the user information
	const userProfile = await auth0.getUser();
	//if email is verified show the order pizza button
	console.log("EMAILVerified?? : "+userProfile["email_verified"])
	if(userProfile["email_verified"])
	{
		console.log("email is verified");
		document.getElementById("email-verified").classList.remove("hidden");
	}	
	
    document.getElementById("ipt-user-profile").textContent = JSON.stringify(
      await auth0.getUser()
    );

  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }
};

const callApi = async () => {
  try {

    // Get the access token from the Auth0 client
    const token = await auth0.getTokenSilently();

    // Make the call to the API, setting the token
    // in the Authorization header
    const response = await fetch("/api/external", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Fetch the JSON result
    const responseData = await response.json();

    // Display the result in the output element
    const responseElement = document.getElementById("api-call-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);

} catch (e) {
    // Display errors in the console
    console.error(e);
  }
};

const login = async () => {
	try {
		console.log("Logging in");
	  await auth0.loginWithRedirect({
		redirect_uri: window.location.origin
	  });
	} catch (err){
		console.log("Log in failed", err);
	}
};

const logout = () => {
	try {
		console.log("Logging out");
		auth0.logout({
		returnTo: window.location.origin
		});
	} catch (err){
		console.log("Log out failed", err);
	}
};