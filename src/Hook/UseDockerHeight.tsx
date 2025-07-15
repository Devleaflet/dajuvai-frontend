
import { useEffect, useState } from "react"

export function useDocketHeight() {
  const [docketHeight, setDocketHeight] = useState(80) // Default height

  useEffect(() => {
    // Function to measure the actual docket height
    const measureDocketHeight = () => {
     
      const docketElement = document.querySelector(".bottom-docket")
      if (docketElement) {
        const height = docketElement.getBoundingClientRect().height
        setDocketHeight(height)
      }
    }

    // Measure on load and window resize
    measureDocketHeight()
    window.addEventListener("resize", measureDocketHeight)

    return () => {
      window.removeEventListener("resize", measureDocketHeight)
    }
  }, [])

  return docketHeight
}
