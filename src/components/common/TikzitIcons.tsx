import React from 'react';

export interface TikzitIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export interface TikzitImgIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  className?: string;
}

/**
 * Selection Tool Arrow Pointer (tikzit-tool-select.svg)
 */
export const SelectToolIcon: React.FC<TikzitIconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    viewBox="0 0 60 60"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-testid="icon-tool-select"
    {...props}
  >
    <polygon
      points="15.5,9.5 48.5,36.5 28.5,36.5 15.5,52.5"
      fill="#CCCCCC"
      stroke="#4D4D4D"
      strokeWidth="3"
      strokeMiterlimit="10"
    />
  </svg>
);

/**
 * Vertex/Node Tool Circle (tikzit-tool-node.svg)
 */
export const VertexToolIcon: React.FC<TikzitIconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    viewBox="0 0 60 60"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-testid="icon-tool-vertex"
    {...props}
  >
    <circle cx="29.5" cy="30.5" r="20" fill="#CCCCCC" />
    <path
      d="M29.5,13C39.1,13,47,20.9,47,30.5S39.1,48,29.5,48S12,40.1,12,30.5S19.9,13,29.5,13 M29.5,8 C17.1,8,7,18.1,7,30.5S17.1,53,29.5,53S52,42.9,52,30.5S41.9,8,29.5,8L29.5,8z"
      fill="#4D4D4D"
    />
  </svg>
);

/**
 * Edge Bézier Curve with Tangent Handles (tikzit-tool-edge.svg)
 */
export const EdgeToolIcon: React.FC<TikzitIconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    viewBox="0 0 60 60"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-testid="icon-tool-edge"
    {...props}
  >
    <path d="M21.5,15.5c27,0,27,29,0,28.5" stroke="#4D4D4D" strokeWidth="3" strokeMiterlimit="10" />
    <line x1="21.5" y1="15.5" x2="48.5" y2="15.5" stroke="#009245" strokeWidth="3" strokeMiterlimit="10" opacity="0.82" />
    <circle cx="14" cy="15" r="6.5" fill="#CCCCCC" />
    <path
      d="M14,10c2.8,0,5,2.2,5,5s-2.2,5-5,5s-5-2.2-5-5S11.2,10,14,10 M14,7c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8 S18.4,7,14,7L14,7z"
      fill="#4D4D4D"
    />
    <circle cx="48.5" cy="15.5" r="3.5" fill="#39B54A" />
    <path
      d="M48.5,13c1.4,0,2.5,1.1,2.5,2.5S49.9,18,48.5,18S46,16.9,46,15.5S47.1,13,48.5,13 M48.5,11 C46,11,44,13,44,15.5s2,4.5,4.5,4.5s4.5-2,4.5-4.5S51,11,48.5,11L48.5,11z"
      fill="#009245"
    />
    <line x1="21.5" y1="44" x2="48.5" y2="44" stroke="#009245" strokeWidth="3" strokeMiterlimit="10" opacity="0.82" />
    <circle cx="48.5" cy="44" r="3.5" fill="#39B54A" />
    <path
      d="M48.5,41.5c1.4,0,2.5,1.1,2.5,2.5s-1.1,2.5-2.5,2.5S46,45.4,46,44S47.1,41.5,48.5,41.5 M48.5,39.5 c-2.5,0-4.5,2-4.5,4.5s2,4.5,4.5,4.5s4.5-2,4.5-4.5S51,39.5,48.5,39.5L48.5,39.5z"
      fill="#009245"
    />
    <circle cx="15" cy="44" r="6.5" fill="#CCCCCC" />
    <path
      d="M15,39c2.8,0,5,2.2,5,5s-2.2,5-5,5s-5-2.2-5-5S12.2,39,15,39 M15,36c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8 S19.4,36,15,36L15,36z"
      fill="#4D4D4D"
    />
  </svg>
);

/**
 * Bounding Box / Crop Tool (crop.svg)
 */
export const CropToolIcon: React.FC<TikzitIconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-testid="icon-tool-crop"
    {...props}
  >
    <path
      d="M12 6v26h26M36 42V16H10"
      stroke="#CCCCCC"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * New Document Action Icon (document-new.svg)
 */
export const NewDocumentIcon: React.FC<TikzitImgIconProps> = ({ size = 16, className = '', alt = 'New Document', ...props }) => (
  <img
    src="/icons/document-new.svg"
    width={size}
    height={size}
    alt={alt}
    className={`inline-block select-none ${className}`}
    draggable={false}
    data-testid="icon-document-new"
    {...props}
  />
);

/**
 * Open Document Action Icon (document-open.svg)
 */
export const OpenDocumentIcon: React.FC<TikzitImgIconProps> = ({ size = 16, className = '', alt = 'Open Document', ...props }) => (
  <img
    src="/icons/document-open.svg"
    width={size}
    height={size}
    alt={alt}
    className={`inline-block select-none ${className}`}
    draggable={false}
    data-testid="icon-document-open"
    {...props}
  />
);

/**
 * Edit Style Action Icon (text-x-generic_with_pencil.svg)
 */
export const EditDocumentIcon: React.FC<TikzitImgIconProps> = ({ size = 16, className = '', alt = 'Edit Style', ...props }) => (
  <img
    src="/icons/text-x-generic_with_pencil.svg"
    width={size}
    height={size}
    alt={alt}
    className={`inline-block select-none ${className}`}
    draggable={false}
    data-testid="icon-edit-document"
    {...props}
  />
);

/**
 * Refresh Stylesheet Action Icon (refresh.svg)
 */
export const RefreshIcon: React.FC<TikzitImgIconProps> = ({ size = 16, className = '', alt = 'Refresh', ...props }) => (
  <img
    src="/icons/refresh.svg"
    width={size}
    height={size}
    alt={alt}
    className={`inline-block select-none ${className}`}
    draggable={false}
    data-testid="icon-refresh"
    {...props}
  />
);

/**
 * TikZiT Application Brand Logo
 */
export const TikzitLogoIcon: React.FC<TikzitImgIconProps> = ({ size = 20, className = '', alt = 'TikZiT Logo', ...props }) => (
  <img
    src="/icons/tikzit.png"
    width={size}
    height={size}
    alt={alt}
    className={`inline-block select-none ${className}`}
    draggable={false}
    data-testid="icon-tikzit-logo"
    {...props}
  />
);
