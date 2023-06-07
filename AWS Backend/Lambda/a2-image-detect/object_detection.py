# import the necessary packages
import numpy as np
import sys
import time
import cv2
import os
import base64
from decimal import Decimal
from collections import Counter

# construct the argument parse and parse the arguments
confthres = 0.3
nmsthres = 0.1


def get_labels(labels_path):
    # load the COCO class labels our YOLO model was trained on
    lpath = os.path.sep.join([yolo_path, labels_path])
    LABELS = open(lpath).read().strip().split("\n")
    return LABELS


def get_weights(weights_path):
    # derive the paths to the YOLO weights and model configuration
    weightsPath = os.path.sep.join([yolo_path, weights_path])
    return weightsPath


def get_config(config_path):
    configPath = os.path.sep.join([yolo_path, config_path])
    return configPath


def load_model(configpath, weightspath):
    # load our YOLO object detector trained on COCO dataset (80 classes)
    print("[INFO] loading YOLO from disk...")
    net = cv2.dnn.readNetFromDarknet(configpath, weightspath)
    return net


def do_prediction(image, net, LABELS):

    (H, W) = image.shape[:2]
    # determine only the *output* layer names that we need from YOLO
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]

    # construct a blob from the input image and then perform a forward
    # pass of the YOLO object detector, giving us our bounding boxes and
    # associated probabilities
    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416),
                                 swapRB=True, crop=False)
    net.setInput(blob)
    start = time.time()
    layerOutputs = net.forward(ln)
    # print(layerOutputs)
    end = time.time()

    # show timing information on YOLO
    print("[INFO] YOLO took {:.6f} seconds".format(end - start))

    # initialize our lists of detected bounding boxes, confidences, and
    # class IDs, respectively
    boxes = []
    confidences = []
    classIDs = []

    # loop over each of the layer outputs
    for output in layerOutputs:
        # loop over each of the detections
        for detection in output:
            # extract the class ID and confidence (i.e., probability) of
            # the current object detection
            scores = detection[5:]
            # print(scores)
            classID = np.argmax(scores)
            # print(classID)
            confidence = scores[classID]

            # filter out weak predictions by ensuring the detected
            # probability is greater than the minimum probability
            if confidence > confthres:
                # scale the bounding box coordinates back relative to the
                # size of the image, keeping in mind that YOLO actually
                # returns the center (x, y)-coordinates of the bounding
                # box followed by the boxes' width and height
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")

                # use the center (x, y)-coordinates to derive the top and
                # and left corner of the bounding box
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))

                # update our list of bounding box coordinates, confidences,
                # and class IDs
                boxes.append([x, y, int(width), int(height)])

                confidences.append(float(confidence))
                classIDs.append(classID)

    # apply non-maxima suppression to suppress weak, overlapping bounding boxes
    idxs = cv2.dnn.NMSBoxes(boxes, confidences, confthres,
                            nmsthres)

    # TODO Prepare the output as required to the assignment specification
    # ensure at least one detection exists
    output = []
    if len(idxs) >= 1:
        # loop over the indexes we are keeping
        for i in idxs.flatten():
            output.append(LABELS[classIDs[i]])
    
    # Count the tags
    tag_counts = Counter(output)

    # Create a list of dictionaries for the output
    output_with_counts = [{"tag": tag, "count": count} for tag, count in tag_counts.items()]

    return output_with_counts


yolo_path = "/opt/yolo_tiny_configs"

# Yolov3-tiny versrion
wpath = "yolov3-tiny.weights"
labelsPath = "coco.names"
cfgpath = "yolov3-tiny.cfg"

# Get paths for config, labels, and weights
CFG = get_config(cfgpath)
Lables = get_labels(labelsPath)
Weights = get_weights(wpath)

# Function to read image from a base64 encoded image
def read_image(image_base64):
    # use numpy to decode base64 string to bytes
    iamge_bytes = np.fromstring(base64.b64decode(image_base64), np.uint8)
    # use opencv image decode to read bytes
    image = cv2.imdecode(iamge_bytes, cv2.IMREAD_COLOR).copy()
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image

# Function to detect objects from a base64 encoded image
def detect_image(image_base64):
    # read image
    image = read_image(image_base64)
    # analyze image
    nets = load_model(CFG, Weights)
    result = do_prediction(image, nets, Lables)
    return result


# TODO, you should  make this console script into webservice using Flask
# Main function
def main():
    try:
        imageFile = str(sys.argv[2])
        image = cv2.imread(imageFile)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        # load the neural net.  Should be local to this method as its multi-threaded endpoint
        nets = load_model(CFG, Weights)
        do_prediction(image, nets, Lables)
    except Exception as e:
        print("Exception  {}".format(e))


# Check arguments and call the main function
if __name__ == '__main__':
    # argument
    if len(sys.argv) != 3:
        raise ValueError("Argument list is wrong. Please use the following format:  {} {} {}".
                         format("python iWebLens_server.py", "<yolo_config_folder>", "<Image file path>"))
    main()
