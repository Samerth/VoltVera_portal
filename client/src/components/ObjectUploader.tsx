import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }>; failed: Array<any> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component that opens a file dialog and uploads files directly.
 * 
 * Features:
 * - Renders as a customizable button
 * - Opens native file dialog when clicked
 * - Uploads files directly using fetch API
 * - Provides upload progress and error handling
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 * @param props.maxFileSize - Maximum file size in bytes
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Validate file size
      if (file.size > maxFileSize) {
        throw new Error(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      }

      // Get upload parameters
      const uploadParams = await onGetUploadParameters();
      console.log('Upload parameters:', uploadParams);

      // Upload the file
      const uploadResponse = await fetch(uploadParams.url, {
        method: uploadParams.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // Call onComplete with the result
      onComplete?.({
        successful: [{ uploadURL: uploadParams.url }],
        failed: []
      });

      console.log('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      onComplete?.({
        successful: [],
        failed: [{ error: error.message }]
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Handle only the first file (respecting maxNumberOfFiles)
    const file = files[0];
    await handleUpload(file);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxNumberOfFiles > 1}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : children}
      </Button>
    </div>
  );
}