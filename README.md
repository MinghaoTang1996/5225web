# 5225web

Team report:  

https://docs.google.com/document/d/1qgmN-5o1qPi01hj-kaunFHMLHSXKxX2Khnl9pt62BRc/edit?usp=sharing  

architecture diagram:  

https://lucid.app/lucidchart/f4bcd10f-9f25-4f62-89f3-0867bc80d665/edit?viewport_loc=-156%2C286%2C1579%2C783%2C11Z2evwRBl31&invitationId=inv_b5358056-2f9a-455b-961a-c507f7692c75

--- 
## AWS services APIs
1. upload image
    - API:  https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/image
    - method: POST
    - request JSON eample: {"name":"image.jpg","file":"/9j/4AAQSkZJRgABAQEASABIAAD/2w...."}
    - return JSON eample:{"name": "images/acdd49a6fe1011eda7a9b2705f222ada.jpg"}

2. find by tag
    - API:  https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbytag
    - method: POST
    - request JSON eample: {"tags": [{"tag": "person","count": 1}]}
    - return JSON eample:{"links": ["https://a3-image.s3.amazonaws.com/images/acdd49a6fe1011eda7a9b2705f222ada.jpg"]}

3. find by image
    - API:  https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/findbyimage
    - method: POST
    - request JSON eample: {"image":"/9j/4AAQSkZJRgABAQEASABIAAD/2w...."}
    - return JSON eample:{"links": [],"tags": ["cup"]}

4. Manual change tags
    - API:  https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/munualchangetag
    - method: POST
    - request JSON eample: {"url":"https://a3-image.s3.amazonaws.com/images/acdd49a6fe1011eda7a9b2705f222ada.jpg","type": 1, "tags": [{"tag": "person","count": 2},{"tag": "alex","count": 1}]}
    - return JSON eample:{"Tags updated successfully"}

5. Delete image
    - API:  https://rhnlx9ogtj.execute-api.us-east-1.amazonaws.com/pd/deleteimage
    - method: POST
    - request JSON eample: {"url":"https://a3-image.s3.amazonaws.com/images/abcdabcd.jpg"}
    - return JSON eample:{"Image successfully deleted"}