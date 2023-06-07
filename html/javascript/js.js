// Parse the URL fragment to get the ID token
const hashFragment = window.location.hash.substr(1);
const idToken = new URLSearchParams(hashFragment).get('id_token');
const user_id = decodeIdToken(idToken).sub;
console.log(user_id);


// Check if the user is logged in
document.getElementById('logoutButton').onclick = function() {
    // Clear user login data
    const user_id = null;
    console.log(user_id);
    // Redirect to login page
    window.location.href = "login.html";
};

// Convert image to base64
async function convertImageToBase64(image) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result.split(",")[1]);
        fileReader.onerror = error => reject(error);
        fileReader.readAsDataURL(image);
    });
}

// Upload image to S3
async function uploadImage(event) {
    event.preventDefault();
    const image = document.querySelector('#file').files[0];
    const base64Str = await convertImageToBase64(image);
    try {
        const response = await fetch("https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/image", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({name:image.name,file:base64Str,user_id:user_id})
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

// Define variables to hold the JSON request and response
var requestJSON = null;
var responseJSON = null;

// Show all images
// document.addEventListener('DOMContentLoaded', function() {
//     openTab(null, 'showAllImages');
// });

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
        responseJSON = data;
        console.log(responseJSON);

        //processResponseJSON(responseJSON);
        displayImages(responseJSON.images)

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




//find image by tags
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
            document.getElementById('image_result').innerHTML = result;
            console.log(result);
            //processResponseJSON(responseJSON);
            var outputJSON = formatJSON(responseJSON);
            displayImages(outputJSON.images);
        })
        .catch(error => console.error('Error:', error));
        

}

// Define a separate function to fetch responseJSON
function processResponseJSON(responseJSON) {
  let links, tags;
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
  } 
  // If responseJSON has "images" property
  else if (Array.isArray(responseJSON.images)) {
    // If responseJSON has "images" property
    links = responseJSON.images.map(img => img.url);
    tags = responseJSON.images.flatMap(img => 
      img.tags.map(tag => ({
        tag: tag.tag,
        count: tag.count
      }))
    );
    displayImages(links, tags);
  }
  
  else {
    // If responseJSON is already a JSON object, use it directly
    let tagArray = responseJSON.links.map(link => ({
      tag: responseJSON.tags[0],
      count: 1
    })
    
    );
    //console.log(responseJSON.links);
    displayImages(responseJSON.links, tagArray);
  }
}


function formatJSON(responseJSON) {
  var images = [];
  for (var i = 0; i < responseJSON.links.length; i++) {
    var image = {};
    image.url = responseJSON.links[i];
    image.tags = [];
    for (var j = 0; j < responseJSON.tags.length; j++) {
      image.tags.push({
        count: 1,
        tag: responseJSON.tags[j],
      });
    }
    images.push(image);
  }
  var outputJSON = {
    images: images,
  };
  return outputJSON;
}



// Function to load the test JSON data with tag
function loadTestDataWithTag() {
  //testdisplay();

  fetch("./test_json/test_withtag.json")
      .then(response => response.json())
      .then(data => {
      var outputJSON = formatJSON(data);
      displayImages(outputJSON.images);
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
      console.log(data.links);
      console.log(tagArray);

      //displayImages(data.links, tagArray);
  });
  }




  // Function to edit the tag for an image
  // Function to display images and tags
  function displayImages(images) {
    // Get the image list element
    const imageList = document.getElementById("image-list");
  
    // Clear the image list
    imageList.innerHTML = "";
  
    // Loop through the images and create an image element for each image
    images.forEach((image, index) => {
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-container");
  
      const imageElement = document.createElement("img");
      imageElement.src = image.url;
      imageElement.classList.add("image");
  
      const urlElement = document.createElement("div");  // new line
      //urlElement.textContent = `URL: ${image.url}`;  // new line
      if (image.url.length > 50) {
        const shortUrl = image.url.slice(0, 25) + '...' + image.url.slice(-25);
        urlElement.innerHTML = `URL: <a href="${image.url}">${shortUrl}</a>`;
      } else {
        urlElement.textContent = `URL: ${image.url}`;
      }
  
      const tagElement = document.createElement("div");
      tagElement.classList.add("tag");
      tagElement.textContent = `Tags:`;
  
      // Loop through the tags and create a tag element for each tag
      image.tags.forEach((tag) => {
        const tagElementInner = document.createElement("div");
        tagElementInner.textContent = `${tag.tag} (${tag.count})`;
        tagElement.appendChild(tagElementInner);
      });

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

      editButton.addEventListener("click", () => {
        const url = image.url;
        const tagArray = image.tags;
      
        // Determine the existing tags and their counts
        const tagCounts = tagArray.reduce((acc, curr) => {
          acc[curr.tag] = curr.count;
          return acc;
        }, {});
      
        // Create the tag edit interface and display it in a modal window
        const modalBackground = document.createElement("div");
        modalBackground.className = "modal-background";
        modalBackground.addEventListener("click", (event) => {
          if (event.target === modalBackground) {
            closeModal();
          }
        });
      
        const modalDiv = document.createElement("div");
        modalDiv.className = "modal";
        modalDiv.innerHTML = `
          <h2>Edit Tags</h2>
          <form>
            <div class="tag-edit">
              ${Object.keys(tagCounts).map(tag => `
                <div>
                  <label>${tag}:</label>
                  <button type="button" data-action="decrease" data-tag="${tag}">-</button>
                  <span>${tagCounts[tag]}</span>
                  <button type="button" data-action="increase" data-tag="${tag}">+</button>
                </div>
              `).join("")}
              <div>
                <input type="text" name="new-tag-name" placeholder="New Tag Name">
                <input type="number" name="new-tag-count" placeholder="Count" value="1" min="0">
                <button type="button" data-action="add">Add</button>
              </div>
            </div>
            <div class="modal-buttons">
              <button type="button" class="cancel-button">Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        `;
      
        const closeModal = () => {
          document.body.removeChild(modalBackground);
          modalBackground.removeEventListener("click", closeModal);
          modalDiv.querySelector(".cancel-button").removeEventListener("click", closeModal);
        };
        modalDiv.querySelector(".cancel-button").addEventListener("click", closeModal);
        
        modalDiv.addEventListener("submit", event => {
          event.preventDefault();
      
          // Construct the arrays of tag objects for the API request
          const removeTags = [];
          const addTags = [];
          modalDiv.querySelectorAll(".tag-edit > div").forEach(tagDiv => {
            const nameInput = tagDiv.querySelector("[name=new-tag-name]");
            if (nameInput) {
              const name = nameInput.value.trim();
              const count = parseInt(tagDiv.querySelector("[name=new-tag-count]").value);
              if (name === "") {
                return;
              }
              if (count > 0) {
                addTags.push({tag: name, count: count});
              }
            } else {
              const tag = tagDiv.querySelector("label").textContent.replace(":", "");
              const count = parseInt(tagDiv.querySelector("span").textContent);
              const origCount = tagCounts[tag] || 0;
              if (count > origCount) {
                addTags.push({tag: tag, count: count - origCount});
              } else if (count < origCount) {
                removeTags.push({tag: tag, count: origCount - count});
              }
            }
          });
      
          // Construct the JSON objects for the requests
          if (removeTags.length > 0) {
            const jsonObject1 = JSON.stringify({
              "url": url.split('?')[0],
              "type": 0,
              "tags": removeTags
            });
      
            console.log(jsonObject1);
      
            // Send the first JSON object for tag removal to the API endpoint
            const apiUrl1 = "https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/manualchangetag";
            fetch(apiUrl1, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: jsonObject1
            })
            .then(response => response.json())
            .then(data => {
              console.log(data);
              const jsonString = JSON.stringify(data, null, 2);
              if (!jsonString.includes("Tags updated successfully")) {
                console.error('Failed to update image tags:', data);
              }
            })
            .catch(error => console.error('Error:', error));
          }
      
          if (addTags.length > 0) {
            const jsonObject2 = JSON.stringify({
              "url": url.split('?')[0],
              "type": 1,
              "tags": addTags
            });
      
            console.log(jsonObject2);
      
            // Send the second JSON object for tag additions to the API endpoint
            const apiUrl2 = "https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/manualchangetag";
            fetch(apiUrl2, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: jsonObject2
            })
            .then(response => response.json())
            .then(data => {
              console.log(data);
              const jsonString = JSON.stringify(data, null, 2);
              if (jsonString.includes("Tags updated successfully")) {
                // Update the image object with the new tags
                const updatedTags = addTags.map(tag => ({tag: tag.tag, count: tag.count}));
                image.tags = [
                  ...tagArray.filter(tag => !(tag.tag in tagCounts)),
                  ...updatedTags,
                ];
                if (removeTags.length > 0) {
                  image.tags = image.tags.filter(tag => !removeTags.some(removeTag => removeTag.tag === tag.tag));
                }
      
                // Redraw the images
                displayImages(images);
              } else {
                console.error('Failed to update image tags:', data);
              }
            })
            .catch(error => console.error('Error:', error));
          }
      
          closeModal();
        });
      
        modalDiv.querySelectorAll("[data-action=decrease]").forEach(button => {
          const tag = button.dataset.tag;
          const countElement = button.nextElementSibling;
          const count = parseInt(countElement.textContent);
      
          button.addEventListener("click", () => {
            countElement.textContent = Math.max(0, count - 1);
          });
        });
      
        modalDiv.querySelectorAll("[data-action=increase]").forEach(button => {
          const tag = button.dataset.tag;
          const countElement = button.previousElementSibling;
          const count = parseInt(countElement.textContent);
      
          button.addEventListener("click", () => {
            countElement.textContent = count + 1;
          });
        });
      
        modalDiv.querySelector("[data-action=add]").addEventListener("click", () => {
          const nameInput = modalDiv.querySelector("[name=new-tag-name]");
          const countInput = modalDiv.querySelector("[name=new-tag-count]");
          const name = nameInput.value.trim();
          const count = parseInt(countInput.value);
          if (name === "") {
            return;
          }
      
          const div = document.createElement("div");
          div.innerHTML = `
            <div>
              <label>${name}:</label>
              <button type="button" data-action="decrease" data-tag="${name}">-</button>
              <span>${count}</span>
              <button type="button" data-action="increase" data-tag="${name}">+</button>
            </div>
          `;
      
          const removeButton = div.querySelector("[data-action=decrease]");
          const countElement = div.querySelector("span");
      
          removeButton.addEventListener("click", () => {
            countElement.textContent = Math.max(0, parseInt(countElement.textContent) - 1);
          });
      
          div.querySelector("[data-action=increase]").addEventListener("click", () => {
            countElement.textContent = parseInt(countElement.textContent) + 1;
          });
      
          modalDiv.querySelector(".tag-edit").appendChild(div);
          nameInput.value = "";
          countInput.value = "1";
        });
      
        modalBackground.appendChild(modalDiv);
        document.body.appendChild(modalBackground);

        
      });
      
      
      
      


      // Add event listener to the "Delete Image" button
      deleteButton.addEventListener("click", () => {
        const url = image.url;
        const jsonObject = JSON.stringify({
          "url": url.split('?')[0]
        });

      //console.log(jsonObject);


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
        const jsonString = JSON.stringify(data, null, 2);
          if (jsonString.includes("Image successfully deleted")) {
              //display new images list
              images = images.filter(image => image.url !== url);
              displayImages(images);
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

function testdisplay(){
  const processedJSON = {
    "images": [
      {
        "url": "https://media.vanityfair.com/photos/55ba400ffff2c16856a7656b/master/w_2580%2Cc_limit/ibdl-taylor-swift-best-concert-fashion-03-01.jpg",
        "tags": [
          {
            "count": 1,
            "tag": "cup"
          }
        ]
      },
      {
        "url": "https://media.vanityfair.com/photos/55ba4014fff2c16856a76597/master/w_2580%2Cc_limit/ibdl-taylor-swift-best-concert-fashion-04.jpg",
        "tags": [
          {
            "count": 1,
            "tag": "cup"
          }
        ]
      }
    ]
  };
  console.log(processedJSON);
  console.log(processedJSON.images);
  displayImages(processedJSON.images);
  
}



