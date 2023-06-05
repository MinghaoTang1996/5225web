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

// Show all images
window.onload = function() {
    var useridInput = "b09eef4e-f8d1-4d52-b0d3-e04b56105190";
    fetch('https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/showallimages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ user_id: useridInput }),
    })
    .then(response => response.json())
    .then(data => {
        var imageContainer = document.getElementById('imageContainer');
        data.links.forEach(function(link) {
            var img = document.createElement('img');
            img.src = link;
            imageContainer.appendChild(img);
        });
    })
    .catch(error => console.error('Error:', error));
};

// find image by tags
document.getElementById('tagsForm').addEventListener('submit', function(event) {
    event.preventDefault(); // to prevent the form from submitting normally
    var tagsInput = document.getElementById('tags').value;
    
    // 直接将你得到的 userID 粘贴在这里
    var useridInput = user_id;

    // if no tags were entered, do nothing
    if (!tagsInput) {
        alert("Please enter at least one tag.");
        return;
    }

    // convert tags from comma-separated string to array
    var tags = tagsInput.split(',').map(tag => ({ tag: tag.trim(), count: 1 }));

    fetch('https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbytag', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ tags: tags, user_id: useridInput }),  // 在发送的数据中添加 user_id 字段
    })
    .then(response => response.json())
    .then(data => {
        var searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = ''; // clear previous search results
        data.links.forEach(function(link) {
            var img = document.createElement('img');
            img.src = link;
            searchResults.appendChild(img);
        });
    })
    .catch(error => console.error('Error:', error));
});

// find image by image
document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault(); 
    const file = document.getElementById('image').files[0];

    reader.onloadend = async function () {
        const base64Image = await convertImageToBase64(file);
        const apiUrl = "https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbyimage";
        const payload = JSON.stringify({
            "image": base64Image,
            "user_id": user_id
        });

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: payload
        })
        .then(response => response.json())
        .then(data => {
            const tags = data.tags;
            const links = data.links;
            let result = "<h2>Tags:</h2><ul>";
            
            for (let i = 0; i < tags.length; i++) {
                result += "<li>" + tags[i] + "</li>";
            }
            result += "</ul><h2>Images:</h2><ul>";
            
            for (let i = 0; i < links.length; i++) {
                result += "<li><a href='" + links[i] + "'>" + links[i] + "</a></li>";
            }
            result += "</ul>";
            document.getElementById('result').innerHTML = result;
            console.log(result);
        })
        .catch(error => console.error('Error:', error));
    }
    
    reader.readAsDataURL(file);
});



// Add the event listener to the form
document.querySelector('#form').addEventListener('submit', uploadImage);
