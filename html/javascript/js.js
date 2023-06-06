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

// Define variables to hold the JSON request and response
var requestJSON = null;
var responseJSON = null;

// find image by tags
document.getElementById('addTag').addEventListener('click', function(event) {
    event.preventDefault();
  
    var tagInputs = document.getElementById('tagInputs');
    var newTagInput = document.createElement('div');
    newTagInput.className = 'tagInput';
    newTagInput.innerHTML = `
      <input type="text" class="tag" placeholder="Enter tag">
      <button class="decreaseCount" disabled>-</button>
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

    // Store the request JSON object in the requestJSON variable
  requestJSON = { tags: tags, user_id: useridInput };
  console.log(requestJSON);
    fetch('https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbytag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(requestJSON), // Sending both tags and counts
    })
      .then(response => response.json())
      .then(data => {
        // Store the response JSON object in the responseJSON variable
        responseJSON = data;
        console.log(responseJSON);

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
      if (count > 1) {
        countSpan.textContent = count - 1;
      } else {
        event.target.parentNode.remove();
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
            responseJSON = data;
            console.log(responseJSON);
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
            processResponseJSON(responseJSON);
        })
        .catch(error => console.error('Error:', error));
        

}

// Define a separate function to fetch responseJSON
function processResponseJSON(responseJSON) {
  if (typeof responseJSON === 'string' || responseJSON instanceof String) {
    // If responseJSON is a URL, make a new fetch call
    fetch(responseJSON)
      .then(response => response.json())
      .then(data => {
        let tagArray = data.links.map(link => ({
          tag: data.tags[0],
          count: 1
        }));

        displayImages(data.links, tagArray);
      })
      .catch(error => console.error('Error:', error));
  } else {
    // If responseJSON is already a JSON object, use it directly
    let tagArray = responseJSON.links.map(link => ({
      tag: responseJSON.tags[0],
      count: 1
    }));
    //console.log(responseJSON.links);
    displayImages(responseJSON.links, tagArray);
  }
}


// Function to load the test JSON data with tag
function loadTestDataWithTag() {
  fetch("./test_json/test_withtag.json")
      .then(response => response.json())
      .then(data => {
      // Create an array of tags with count = 1 for each link in the links array
      let tagArray = data.links.map(link => ({tag: data.tags[0], count: 1}));
      console.log(tagArray);
      displayImages(data.links, tagArray);
      });
  }

  // Function to load the test JSON data without tag
  function loadTestDataWithoutTag() {
  Promise.all([
      fetch("test_json/test_notag.json").then(response => response.json()),
      fetch("test_json/test_tag.json").then(response => response.json())
  ])
  .then(([data, tags]) => {
      // Use the tags array from 'test_tag.json'
      let tagArray = data.links.map(link => ({
      tag: tags.tags.map(tag => tag.tag).join(', '),
      count: data.links.length
      }));

      displayImages(data.links, tagArray);
  });
  }




  // Function to edit the tag for an image
  // Function to display images and tags
  function displayImages(links, tagArray) {
    // Get the image list element
    const imageList = document.getElementById("image-list");

    // Clear the image list
    imageList.innerHTML = "";

    // Loop through the links and create an image element for each link
    links.forEach((link, index) => {
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-container");

      const imageElement = document.createElement("img");
      imageElement.src = link;
      imageElement.classList.add("image");

      const urlElement = document.createElement("div");  // new line
      //urlElement.textContent = `URL: ${link}`;  // new line
      if (link.length > 50) {
        const shortLink = link.slice(0, 25) + '...' + link.slice(-25);
        urlElement.innerHTML = `URL: <a href="${link}">${shortLink}</a>`;
      } else {
        urlElement.textContent = `URL: ${link}`;
      }

      const tagElement = document.createElement("div");
      tagElement.classList.add("tag");
      tagElement.textContent = `Tags: ${tagArray[index].tag}`;

      const editButton = document.createElement("button");
      editButton.classList.add("button");
      editButton.textContent = "Edit Tag";
      editButton.dataset.index = index;

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("button");
      deleteButton.textContent = "Delete Image";
      deleteButton.dataset.index = index;

      imageContainer.appendChild(imageElement);
      imageContainer.appendChild(urlElement);  // new line
      imageContainer.appendChild(tagElement);
      imageContainer.appendChild(editButton);
      imageContainer.appendChild(deleteButton);

      imageList.appendChild(imageContainer);

      // Add event listener to the "Edit Tag" button
      editButton.addEventListener("click", () => {
        const tagString = prompt("Enter tags (comma-separated):", tagArray[index].tag);
        const tags = tagString.split(",").map(tag => tag.trim());

        // Determine whether to add or remove tags
        let type = 0; // 0 for remove
        if (tags.length > tagArray[index].tag.split(",").length) {
          type = 1; // 1 for add
        }

        // Construct the JSON object for the request

        const jsonObject = JSON.stringify({
          "url": links[index].split('?')[0],
          "type": type,
          "tags": tags.map(tag => ({tag: tag, count: tagArray.length}))
        });

        console.log(jsonObject);

        // Send the JSON object to the API endpoint
        const apiUrl = "https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/munualchangetag";
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: jsonObject
        })
        .then(response => response.json())

        // Update the tag element text content
        // tagArray[index].tag = tags.join(", ");
        // tagElement.textContent = `Tags: ${tagArray[index].tag}`;
        
        .then(data => {
          console.log(data);
            if (data.body === "Tags updated successfully") {
                tagArray[index].tag = tags.join(", ");
                tagElement.textContent = `Tags: ${tagArray[index].tag}`;
            } else {
                console.error('Failed to update image:', data);
            }
        })
        .catch(error => console.error('Error:', error));
      
      });


      // Add event listener to the "Delete Image" button
      deleteButton.addEventListener("click", () => {
        const jsonObject = JSON.stringify({
        "url": links[index].split('?')[0]
      });

      console.log(jsonObject);


      const apiUrl = "https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/deleteimage";
      fetch(apiUrl, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
          },
          body: jsonObject
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
          if (data.body === "Image successfully deleted") {
              // Find the index of the link in the links array
              const index = links.indexOf(link);

              // Remove the link and tag from their arrays
              links.splice(index, 1);
              tagArray.splice(index, 1);

              // Redraw the images
              displayImages(links, tagArray);
          } else {
              console.error('Failed to delete image:', data);
          }
      })
      .catch(error => console.error('Error:', error));

    });



    });
  }
  

// Add the event listener to the form
document.querySelector('#form').addEventListener('submit', uploadImage);
document.querySelector('#image_form').addEventListener('submit', findimageByimage);

