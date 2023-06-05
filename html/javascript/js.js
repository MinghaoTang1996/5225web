// Parse the URL fragment to get the ID token
const hashFragment = window.location.hash.substr(1);
const idToken = new URLSearchParams(hashFragment).get('id_token');
const user_id = decodeIdToken(idToken).sub;
console.log(user_id);

// Convert image to base64
async function convertImageToBase64(image) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(image);
    });
}

// Upload image to S3
async function uploadImage(event) {
    event.preventDefault();
    const image = document.querySelector('#file').files[0];
    const base64Str = await convertImageToBase64(image);
    const payload = {
        name: image.name,
        file: base64Str,
        user_id: user_id
    };
    try {
        const response = await fetch("https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/image", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(payload)
        })
        if (!response.ok) {
            throw new Error("upload fail");
        }
        const data = await response.json();
        var result = "<h2>Upload Successful!</h2><p>The uploaded image's name: " + data.name + "</p>";
        $('#result').html(result);
    } catch (error) {
        var result = "<h2>Upload Failed!</h2><p>" + error.message + "</p>";
        $('#result').html(result);
    }
}

// Decode the ID token
function decodeIdToken(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(
        atob(base64)
        .split('')
        .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''));

    return JSON.parse(jsonPayload);
}

// Add the event listener to the form
document.querySelector('#form').addEventListener('submit', uploadImage);
