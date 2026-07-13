import React from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ImagePreview({
  src,
  alt = "圖片預覽",
  className,
  children,
}: ImagePreviewProps) {
  return (
    <PhotoProvider
      maskOpacity={0.85}
      bannerVisible={true}
      speed={() => 300}
      easing={() => "cubic-bezier(0.25, 0.1, 0.25, 1.0)"}
    >
      <PhotoView src={src}>
        {children ? (
          <div className="cursor-pointer inline-block w-full">{children}</div>
        ) : (
          <img src={src} alt={alt} className={className} />
        )}
      </PhotoView>
    </PhotoProvider>
  );
}
