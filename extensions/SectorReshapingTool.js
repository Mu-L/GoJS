/*
 *  Copyright 1998-2025 by Northwoods Software Corporation. All Rights Reserved.
 */
/*
 * This is an extension and not part of the main GoJS library.
 * The source code for this is at extensionsJSM/SectorReshapingTool.ts.
 * Note that the API for this class may change with any version, even point releases.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
 * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
 */

/**
 * The SectorReshapingTool class lets the user interactively modify the angles of a "pie"-shaped sector of a circle.
 * When a node is selected, this shows two handles for changing the angles of the sides of the sector and one handle for changing the radius.
 *
 * This depends on there being three data properties, "angle", "sweep", and "radius",
 * that hold the needed information to be able to reproduce the sector.
 *
 * If you want to experiment with this extension, try the <a href="../../samples/SectorReshaping.html">Sector Reshaping</a> sample.
 * @category Tool Extension
 */
class SectorReshapingTool extends go.Tool {
    /**
     * Constructs a SectorReshapingTool and sets the name for the tool.
     */
    constructor(init) {
        super();
        this.name = 'SectorReshaping';
        this._handle = null;
        this._originalRadius = 0;
        this._originalAngle = 0;
        this._originalSweep = 0;
        this._radiusProperty = 'radius';
        this._angleProperty = 'angle';
        this._sweepProperty = 'sweep';
        if (init)
            Object.assign(this, init);
    }
    /**
     * Gets or sets the name of the data property for the sector radius.
     *
     * The default value is "radius".
     */
    get radiusProperty() {
        return this._radiusProperty;
    }
    set radiusProperty(val) {
        if (typeof val !== 'string')
            throw new Error('SectorReshapingTool.radiusProperty must be the string name of a data property.');
        this._radiusProperty = val;
    }
    /**
     * Gets or sets the name of the data property for the sector start angle.
     *
     * The default value is "angle".
     */
    get angleProperty() {
        return this._angleProperty;
    }
    set angleProperty(val) {
        if (typeof val !== 'string')
            throw new Error('SectorReshapingTool.angleProperty must be the string name of a data property.');
        this._angleProperty = val;
    }
    /**
     * Gets or sets the name of the data property for the sector sweep angle.
     *
     * The default value is "sweep".
     */
    get sweepProperty() {
        return this._sweepProperty;
    }
    set sweepProperty(val) {
        if (typeof val !== 'string')
            throw new Error('SectorReshapingTool.sweepProperty must be the string name of a data property.');
        this._sweepProperty = val;
    }
    /**
     * This tool can only start if Diagram.allowReshape is true and the mouse-down event
     * is at a tool handle created by this tool.
     */
    canStart() {
        if (!this.isEnabled)
            return false;
        const diagram = this.diagram;
        if (diagram.isReadOnly)
            return false;
        if (!diagram.allowReshape)
            return false;
        const h = this.findToolHandleAt(diagram.firstInput.documentPoint, this.name);
        return h !== null;
    }
    /**
     * If the Part is selected, show two angle-changing tool handles and one radius-changing tool handle.
     */
    updateAdornments(part) {
        const data = part.data;
        if (part.isSelected && data !== null && !this.diagram.isReadOnly) {
            let ad = part.findAdornment(this.name);
            if (ad === null) {
                ad = new go.Adornment('Spot').add(new go.Placeholder(), new go.Shape('Diamond', { name: 'RADIUS', fill: 'lime', width: 10, height: 10, cursor: 'move' })
                    .bind('alignment', '', d => {
                    const angle = SectorReshapingTool.getAngle(d);
                    const sweep = SectorReshapingTool.getSweep(d);
                    const p = new go.Point(0.5, 0).rotate(angle + sweep / 2);
                    return new go.Spot(0.5 + p.x, 0.5 + p.y);
                }), new go.Shape('Circle', { name: 'ANGLE', fill: 'lime', width: 8, height: 8, cursor: 'move' })
                    .bind('alignment', '', d => {
                    const angle = SectorReshapingTool.getAngle(d);
                    const p = new go.Point(0.5, 0).rotate(angle);
                    return new go.Spot(0.5 + p.x, 0.5 + p.y);
                }), new go.Shape('Circle', { name: 'SWEEP', fill: 'lime', width: 8, height: 8, cursor: 'move' })
                    .bind('alignment', '', d => {
                    const angle = SectorReshapingTool.getAngle(d);
                    const sweep = SectorReshapingTool.getSweep(d);
                    const p = new go.Point(0.5, 0).rotate(angle + sweep);
                    return new go.Spot(0.5 + p.x, 0.5 + p.y);
                }));
                ad.adornedObject = part.locationObject;
                part.addAdornment(this.name, ad);
            }
            else {
                ad.location = part.position;
                const ns = part.naturalBounds;
                if (ad.placeholder && ad.placeholder.visible) {
                    ad.placeholder.desiredSize = new go.Size(ns.width * part.scale, ns.height * part.scale);
                }
                ad.updateTargetBindings();
            }
        }
        else {
            part.removeAdornment(this.name);
        }
    }
    /**
     * Remember the original angles and radius and start a transaction.
     */
    doActivate() {
        const diagram = this.diagram;
        this._handle = this.findToolHandleAt(diagram.firstInput.documentPoint, this.name);
        if (this._handle === null)
            return;
        const part = this._handle.part.adornedPart;
        if (part === null || part.data === null)
            return;
        const data = part.data;
        this._originalRadius = SectorReshapingTool.getRadius(data);
        this._originalAngle = SectorReshapingTool.getAngle(data);
        this._originalSweep = SectorReshapingTool.getSweep(data);
        this.startTransaction(this.name);
        this.isActive = true;
    }
    /**
     * Stop the transaction.
     */
    doDeactivate() {
        this.stopTransaction();
        this._handle = null;
        this.isActive = false;
    }
    /**
     * Restore the original angles and radius and then stop this tool.
     */
    doCancel() {
        if (this._handle !== null) {
            const part = this._handle.part.adornedPart;
            if (part !== null) {
                const model = this.diagram.model;
                model.setDataProperty(part.data, this._radiusProperty, this._originalRadius);
                model.setDataProperty(part.data, this._angleProperty, this._originalAngle);
                model.setDataProperty(part.data, this._sweepProperty, this._originalSweep);
            }
        }
        this.stopTool();
    }
    /**
     * Depending on the current handle being dragged, update the "radius", the "angle", or the "sweep"
     * properties on the model data.
     * Those property names are currently parameterized as static members of SectorReshapingTool.
     */
    doMouseMove() {
        const diagram = this.diagram;
        const h = this._handle;
        if (this.isActive && h !== null) {
            const adorned = h.part.adornedObject;
            if (adorned === null)
                return;
            const center = adorned.getDocumentPoint(go.Spot.Center);
            const node = adorned.part;
            if (node === null || node.data === null)
                return;
            const mouse = diagram.lastInput.documentPoint;
            if (h.name === 'RADIUS') {
                const dst = Math.sqrt(center.distanceSquaredPoint(mouse));
                diagram.model.setDataProperty(node.data, this._radiusProperty, dst);
            }
            else if (h.name === 'ANGLE') {
                const dir = center.directionPoint(mouse);
                diagram.model.setDataProperty(node.data, this._angleProperty, dir);
            }
            else if (h.name === 'SWEEP') {
                const dir = center.directionPoint(mouse);
                const ang = SectorReshapingTool.getAngle(node.data);
                let swp = (dir - ang + 360) % 360;
                if (swp > 359)
                    swp = 360; // make it easier to get a full circle
                diagram.model.setDataProperty(node.data, this._sweepProperty, swp);
            }
        }
    }
    /**
     * Finish the transaction and stop the tool.
     */
    doMouseUp() {
        if (this.isActive) {
            this.transactionResult = this.name; // successful finish
        }
        this.stopTool();
    }
    // static functions for getting data
    /** @hidden @internal */
    static getRadius(data) {
        let radius = data['radius'];
        if (!(typeof radius === 'number') || isNaN(radius) || radius <= 0)
            radius = 50;
        return radius;
    }
    /** @hidden @internal */
    static getAngle(data) {
        let angle = data['angle'];
        if (!(typeof angle === 'number') || isNaN(angle))
            angle = 0;
        else
            angle = angle % 360;
        return angle;
    }
    /** @hidden @internal */
    static getSweep(data) {
        let sweep = data['sweep'];
        if (!(typeof sweep === 'number') || isNaN(sweep))
            sweep = 360;
        return sweep;
    }
}
