/*
 *  Copyright 1998-2025 by Northwoods Software Corporation. All Rights Reserved.
 */

/*
 * This is an extension and not part of the main GoJS library.
 * The source code for this is at extensionsJSM/OverviewResizingTool.ts.
 * Note that the API for this class may change with any version, even point releases.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
 * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
 */

import * as go from 'gojs';

/**
 * The OverviewResizingTool class lets the user resize the box within an overview.
 *
 * If you want to experiment with this extension, try the <a href="../../samples/OverviewResizing.html">Overview Resizing</a> sample.
 * @category Tool Extension
 */
export class OverviewResizingTool extends go.ResizingTool {
  // Internal property used to keep track of changing handle size
  private _handleSize: go.Size;

  /**
   * Constructs an OverviewResizingTool and sets the name for the tool.
   */
  constructor(init?: Partial<OverviewResizingTool>) {
    super();
    this.name = 'OverviewResizing';
    this._handleSize = new go.Size(6, 6);
    if (init) Object.assign(this, init);
  }

  /**
   * @hidden @internal
   * @param resizeBox
   */
  override makeAdornment(resizeBox: go.Shape): go.Adornment {
    this._handleSize.setTo(resizeBox.strokeWidth * 3, resizeBox.strokeWidth * 3);
    // Set up the resize adornment
    const ad = new go.Adornment();
    ad.type = go.Panel.Spot;
    ad.locationSpot = go.Spot.Center;
    const ph = new go.Placeholder();
    ph.isPanelMain = true;
    ad.add(ph);
    const hnd = new go.Shape();
    hnd.name = 'RSZHND';
    hnd.figure = 'Rectangle';
    hnd.desiredSize = this._handleSize;
    hnd.cursor = 'se-resize';
    hnd.alignment = go.Spot.BottomRight;
    hnd.alignmentFocus = go.Spot.Center;
    ad.add(hnd);
    ad.adornedObject = resizeBox;
    return ad;
  }

  /**
   * @hidden @internal
   * Keep the resize handle properly sized as the scale is changing.
   * This overrides an undocumented method on the ResizingTool.
   * @param elt
   * @param angle
   */
  override updateResizeHandles(elt: go.Adornment, angle: number) {
    if (elt === null) return;
    const handle = elt.findObject('RSZHND') as go.Shape;
    const box = elt.adornedObject as go.Shape;
    this._handleSize.setTo(box.strokeWidth * 3, box.strokeWidth * 3);
    handle.desiredSize = this._handleSize;
  }

  /**
   * Overrides {@link go.ResizingTool.resize} to resize the overview box via setting the observed diagram's scale.
   * @param newr - the intended new rectangular bounds the overview box.
   */
  override resize(newr: go.Rect): void {
    const overview = this.diagram as go.Overview;
    const observed = overview.observed;
    if (observed === null) return;
    const oldr = observed.viewportBounds.copy();
    const oldscale = observed.scale;
    if (oldr.width !== newr.width || oldr.height !== newr.height) {
      if (newr.width > 0 && newr.height > 0) {
        observed.scale = Math.min(
          (oldscale * oldr.width) / newr.width,
          (oldscale * oldr.height) / newr.height
        );
      }
    }
  }
}
