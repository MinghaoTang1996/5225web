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
    var useridInput = user_id;
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
        data.images.forEach(function(image) {
            var img = document.createElement('img');
            img.src = image.url;
            imageContainer.appendChild(img);

            var tagsList = document.createElement('ul');
            image.tags.forEach(function(tag) {
                var tagItem = document.createElement('li');
                tagItem.textContent = `Tag: ${tag.tag}, Count: ${tag.count}`;
                tagsList.appendChild(tagItem);
            });

            imageContainer.appendChild(tagsList);
        });
    })
    .catch(error => console.error('Error:', error));
};



document.getElementById('addTag').addEventListener('click', function(event) {
    event.preventDefault();
  
    var tagInputs = document.getElementById('tagInputs');
    var newTagInput = document.createElement('div');
    newTagInput.className = 'tagInput';
    newTagInput.innerHTML = `
      <input type="text" class="tag" placeholder="Enter tag">
      <button class="decreaseCount">-</button>
      <span class="count">1</span>
      <button class="increaseCount">+</button>
    `;
    tagInputs.appendChild(newTagInput);
  });
  
  document.getElementById('tagsForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    var tags = [];
    var tagInputs = document.getElementsByClassName('tagInput');
  
    for (var i = 0; i < tagInputs.length; i++) {
      var tagInput = tagInputs[i].querySelector('.tag');
      var countSpan = tagInputs[i].querySelector('.count');
  
      var tag = tagInput.value.trim();
      var count = parseInt(countSpan.textContent);
  
      if (tag) {
        tags.push({ tag: tag, count: count });
      }
    }
  
    // 直接将你得到的 userID 粘贴在这里
    var useridInput = user_id;
  
    // if no tags were entered, do nothing
    if (tags.length === 0) {
      alert("Please enter at least one tag.");
      return;
    }
  
    fetch('https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbytag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ tags: tags, user_id: useridInput }), // Sending both tags and counts
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
  
  // increase and decrease count
  document.addEventListener('click', function(event) {
    if (event.target.matches('.increaseCount')) {
      var countSpan = event.target.parentNode.querySelector('.count');
      var count = parseInt(countSpan.textContent);
      countSpan.textContent = count + 1;
  
      var decreaseButton = event.target.parentNode.querySelector('.decreaseCount');
      decreaseButton.disabled = false;
    } else if (event.target.matches('.decreaseCount')) {
        var countSpan = event.target.parentNode.querySelector('.count');
        var count = parseInt(countSpan.textContent);
        if (count === 1) {
            event.target.parentNode.remove();
          } else {
            countSpan.textContent = count - 1;
        }
  
      
    }
  });
  

// find image by image
async function findimageByimage(event) {
    event.preventDefault();
    const image = document.querySelector('#findByImage_image').files[0];
    const base64Str = await convertImageToBase64(image);
    const payload = JSON.stringify({
        "image": base64Str,
        "user_id": user_id
    });
    const apiUrl = "https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbyimage";
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



// Add the event listener to the form
document.querySelector('#form').addEventListener('submit', uploadImage);
document.querySelector('#image_form').addEventListener('submit', findimageByimage);

