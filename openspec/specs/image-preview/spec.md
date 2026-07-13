# image-preview Specification

## Requirements

### Requirement: User can view image in full screen
系統 SHALL 提供使用者點擊圖片並以全螢幕檢視放大圖片的功能，且支援圖片縮放與拖曳平移。

#### Scenario: Open image preview
- **WHEN** user clicks on a screenshot thumbnail
- **THEN** system opens a full-screen photo preview modal

#### Scenario: Zoom and pan image
- **WHEN** user is in the photo preview modal
- **THEN** user can zoom in/out with mouse wheel or pinch-to-zoom
- **THEN** user can pan the image while zoomed in

#### Scenario: Close image preview
- **WHEN** user clicks the close button or background overlay
- **THEN** system closes the full-screen photo preview modal
