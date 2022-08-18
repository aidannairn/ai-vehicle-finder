import { useState, useEffect, useRef } from "react"
import axios from "axios"

import vehiclesDB from '../vehicles.json'
import '../styles/turners-vehicles.css'

const TurnersVehicles = () => {
  const [imageURL, setImageURL] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [vehicleLabels, setVehicleLabels] = useState([])
  const [matchingVehicles, setMatchingVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    REACT_APP_GOOGLE_API_URL: googleApiUrl,
    REACT_APP_GOOGLE_API_BEARER: googleApiBearer
  } = process.env

  const canvasRef = useRef(null)

  const toDataURL = (src, callback) => {
    var img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function() {
      var canvas = document.createElement('canvas')
      var context = canvas.getContext('2d')
      var dataURL
      canvas.height = this.naturalHeight
      canvas.width = this.naturalWidth
      context.drawImage(this, 0, 0)
      dataURL = canvas.toDataURL()
      callback(dataURL)
    }
    img.src = src
    if (img.complete || img.complete === undefined) {
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
      img.src = src
    }
  }

  useEffect(() => {
    if (imageBase64) {
      const data = {
        "payload": {
          "image": {
            "imageBytes": imageBase64
          }
        }
      }

      const config =  {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer $(gcloud auth application-default print-access-token)'
          'Authorization': `Bearer ${googleApiBearer}`
        }
      }

      axios.post(googleApiUrl, data, config)
      .then(res => {
        const labels = []
        res.data.payload.map(vehicleLabel => {
          const label = {
            label: vehicleLabel.displayName,
            percentage: Math.round(vehicleLabel.classification.score * 100)
          }
          labels.push(label)
        })
        setVehicleLabels(labels)
      })
      .catch((error) => {
        console.error(error)
      })
    }
  }, [imageBase64])

  useEffect(() => {
    if (vehicleLabels.length) {
      const labels = []
      const matches = []
      vehicleLabels.map(vl => labels.push(vl.label))
      
      vehiclesDB.map(vehicle => {
        const makeAndLabels = [vehicle.make, ...vehicle.labels]
        
        const matchedLabels = []

        if (labels.some(label => makeAndLabels.includes(label))) {
          let matchCount = 0
          makeAndLabels.map(label => {
            if (labels.includes(label)) {
              matchedLabels.push(label)
              matchCount ++
            }
          })
          vehicle.matchedLabels = matchedLabels
          vehicle.matchCount = matchCount
          matches.push(vehicle)
        }
      })
      
      const sortedMatches = matches.sort((a, b) => b.matchCount - a.matchCount)
      setMatchingVehicles(sortedMatches)
      setIsLoading(false)
    }
  }, [vehicleLabels])
  
  
  const drawImageOnCanvas = (image, canvas, context) => {
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    canvas.width = image.width
    canvas.height = image.height

    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    const isLandscape = naturalWidth > naturalHeight
    context.drawImage(
      image,
      isLandscape ? (naturalWidth - naturalHeight) / 2 : 0,
      isLandscape ? 0 : (naturalHeight - naturalWidth) / 2,
      isLandscape ? naturalHeight : naturalWidth,
      isLandscape ? naturalHeight : naturalWidth,
      0,
      0,
      context.canvas.width,
      context.canvas.height
    )
  }

  const handleUploadChange = ({ target }) => {
    setImageURL(null)
    setImageBase64(null)
    setVehicleLabels([])
    setMatchingVehicles([])
    setIsLoading(true)
    const imgUrl = URL.createObjectURL(target.files[0])
    setImageURL(imgUrl)
    toDataURL(
      imgUrl,
      (dataUrl) => setImageBase64(dataUrl.split("base64,")[1])
    )    
  }

  const onImageChange = async ({ target }) => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    drawImageOnCanvas(target, canvas, context)
  }

  const VehiclePreview = () => (
    <div id="vehicle-preview">
      <canvas id="new-img" ref={canvasRef}>
        <img alt="preview" onLoad={onImageChange} src={imageURL} />
      </canvas>
    </div>
  )

  return (
    <div id="turners-vehicles">
      <div id="image-uploader">
        <div className="left">
          <h1>Looking for a vehicle?</h1>
          <h2>Try our search-by-image option</h2>
          <div className="custom-upload-btn">
            <div className="btn-text">
              <h4>Upload An Image</h4>
            </div>
            <input
              type="file"
              onChange={handleUploadChange}
              accept="image/x-png,image/jpeg"
            />
          </div>
        </div>
        <div className="right">
          {imageURL && <VehiclePreview />}
        </div>
      </div>
      {isLoading ? <div className="loader-container">
        <h2>Loading similar vehicles</h2>
        <div className="loader-dots"></div>
      </div> : (
        <>
          {matchingVehicles && <div id="matching-vehicles">
            {matchingVehicles.map((vehicle, i) => {
              const { make, model, image, matchedLabels } = vehicle
              return <div key={i} className="vehicle-container">
                <div className="img-wrapper">
                  <img src={image} alt={`${make} ${model} image`} />
                </div>
                <div className="vehicle-chips-container">
                  <div className="make-and-model">
                    <p>{make} {model}</p>
                  </div>
                  <div className="label-chips">
                  {matchedLabels.map((label, i) => {
                    return <div key={i} className="label-chip"><h5>{label}</h5></div>
                  })}
                  </div>
                </div>
              </div>
            })}
          </div>}
        </>
      )}
    </div>
  )
}

export default TurnersVehicles