import domtoimage from "dom-to-image";

/**
 * Captures specific chart elements from the DOM and converts them to base64 PNG images.
 * @param modelIds The list of chart model IDs to capture.
 * @returns A promise that resolves to a record of model IDs to base64 image strings.
 */
export async function captureCharts(modelIds: string[]): Promise<Record<string, string>> {
  const chartImages: Record<string, string> = {};

  if (!modelIds || modelIds.length === 0) {
    return chartImages;
  }

  const scale = 2; // Increase scale to capture high-res charts

  for (const modelId of modelIds) {
    const chartElement = document.getElementById(`chart-${modelId}`);
    if (chartElement) {
      try {
        const imgData = await domtoimage.toPng(chartElement, {
          bgcolor: '#ffffff',
          quality: 1,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: chartElement.offsetWidth + 'px',
            height: chartElement.offsetHeight + 'px'
          },
          width: chartElement.offsetWidth * scale,
          height: chartElement.offsetHeight * scale
        });
        
        chartImages[modelId] = imgData;
      } catch (e) {
        console.error("Failed to capture chart", modelId, e);
      }
    }
  }

  return chartImages;
}
