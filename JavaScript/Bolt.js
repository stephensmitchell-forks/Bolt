//Author-Autodesk Inc.
//Description-Create a bolt.
/*globals adsk*/
(function () {
    
    "use strict";
    
    var defaultBoltName = 'Bolt';
    var defaultHeadDiameter = 0.75;
    var defaultBodyDiameter = 0.5;
    var defaultHeadHeight = 0.3125;
    var defaultBodyLength = 2.0;
    var defaultCutAngle = 30.0 * (Math.PI / 180);
    var defaultChamferDistance = 0.03845;
    var defaultFilletRadius = 0.02994;
    
    var app = adsk.core.Application.get(), ui;
    if (app) {
        ui = app.userInterface;
    }

    var newComp;

    function createNewComponent() {
        // Get the active design.
        var product = app.activeProduct;
        var design = adsk.fusion.Design(product);
        var rootComp = design.rootComponent;
        var allOccs = rootComp.occurrences;
        var newOcc = allOccs.addNewComponent(adsk.core.Matrix3D.create());
        newComp = newOcc.component;
    }

    // Create the command definition.
    var createCommandDefinition = function() {
        var commandDefinitions = ui.commandDefinitions;
        
        // Be fault tolerant in case the command is already added...
        var cmDef = commandDefinitions.itemById('Bolt');
        if (!cmDef) {
            cmDef = commandDefinitions.addButtonDefinition('Bolt', 
                    'Create Bolt', 
                    'Create a bolt.',
                    './resources'); // relative resource file path is specified
        }
        return cmDef;
    };
    
    // CommandCreated event handler.
    var onCommandCreated = function(args) {
        try
        {
            // Connect to the CommandExecuted event.
            var command = args.command;
            command.execute.add(onCommandExecuted);
            // Connect to the CommandPreviewExecuted event.
            command.executePreview.add(onCommandExecuted);
            // Terminate the script when the command is destroyed
            command.destroy.add(function () { adsk.terminate(); });
            // Define the inputs.
            var inputs = command.commandInputs;
            inputs.addStringValueInput('boltName', 'Blot Name', defaultBoltName);
            
            var initHeadDiameter = adsk.core.ValueInput.createByReal(defaultHeadDiameter);
            inputs.addValueInput('headDiameter', 'Head Diameter','cm',initHeadDiameter);
            
            var initBodyDiameter = adsk.core.ValueInput.createByReal(defaultBodyDiameter);
            inputs.addValueInput('bodyDiameter', 'Body Diameter', 'cm', initBodyDiameter);
            
            var initHeadHeight = adsk.core.ValueInput.createByReal(defaultHeadHeight);
            inputs.addValueInput('headHeight', 'Head Height', 'cm', initHeadHeight);
            
            var initBodyLength = adsk.core.ValueInput.createByReal(defaultBodyLength);
            inputs.addValueInput('bodyLength', 'Body Length', 'cm', initBodyLength);
            
            //to do the thread length

            var initCutAngle = adsk.core.ValueInput.createByReal(defaultCutAngle);
            inputs.addValueInput('cutAngle', 'Cut Angle', 'deg', initCutAngle);
            
            var initChamferDistance = adsk.core.ValueInput.createByReal(defaultChamferDistance);
            inputs.addValueInput('chamferDistance', 'Chamfer Distance', 'cm', initChamferDistance);
            
            var initFilletRadius = adsk.core.ValueInput.createByReal(defaultFilletRadius);
            inputs.addValueInput('filletRadius', 'Fillet Radius', 'cm', initFilletRadius);
        }
        catch (e) {
            ui.messageBox('Failed to create command : ' + (e.description ? e.description : e));
        }
    };

    // CommandExecuted event handler.
    var onCommandExecuted = function(args) {
        try {
            var unitsMgr = app.activeProduct.unitsManager;
            
            var command = adsk.core.Command(args.firingEvent.sender);
            var inputs = command.commandInputs;
            
            var bolt = new Bolt();
            
            // Problem with a problem - the inputs are empty at this point. We
            // need access to the inputs within a command during the execute.
            for (var n = 0; n < inputs.count; n++) {
                var input = inputs.item(n);
                if (input.id === 'boltName') {
                    bolt.boltName = input.value;
                }
                else if (input.id === 'headDiameter') {
                    bolt.headDiameter = unitsMgr.evaluateExpression(input.expression, "cm");
                }
                else if (input.id === 'bodyDiameter') {
                    bolt.bodyDiameter = unitsMgr.evaluateExpression(input.expression, "cm");
                }
                else if (input.id === 'headHeight') {
                    bolt.headHeight = unitsMgr.evaluateExpression(input.expression, "cm");
                }
                else if (input.id === 'bodyLength') {
                    bolt.bodyLength = adsk.core.ValueInput.createByString(input.expression);
                }
                else if (input.id === 'cutAngle') {
                    bolt.cutAngle = unitsMgr.evaluateExpression(input.expression, "deg"); 
                }
                else if (input.id === 'chamferDistance') {
                    bolt.chamferDistance = adsk.core.ValueInput.createByString(input.expression);
                }
                else if (input.id === 'filletRadius') {
                    bolt.filletRadius = adsk.core.ValueInput.createByString(input.expression);
                }
            }
            
            bolt.buildBolt();
            args.isValidResult = true;
         } 
         catch (e) {        
            ui.messageBox('Failed to create Bolt : ' + (e.description ? e.description : e));
        }
    };
    
    var Bolt = function(){
        this.boltName = defaultBoltName;
        this.headDiameter = defaultHeadDiameter;
        this.bodyDiameter = defaultBodyDiameter;
        this.headHeight = defaultHeadHeight;
        this.bodyLength = adsk.core.ValueInput.createByReal(defaultBodyLength);
        this.cutAngle = defaultCutAngle;
        this.chamferDistance = adsk.core.ValueInput.createByReal(defaultChamferDistance);
        this.filletRadius = adsk.core.ValueInput.createByReal(defaultFilletRadius);

        // Construct a bolt.
        this.buildBolt = function() {
            createNewComponent();
            if (!newComp) {
                ui.messageBox('New component failed to create', 'New Component Failed');
                adsk.terminate();
                return;
            }
            // Create a new sketch.
            var sketches = newComp.sketches;
            var xyPlane = newComp.xYConstructionPlane;
            var xzPlane = newComp.xZConstructionPlane;
            var sketch = sketches.add(xyPlane);
            var center = adsk.core.Point3D.create(0, 0, 0);
            var vertices =[];
            for(var i =0; i < 6; i++) {
                var vertex = adsk.core.Point3D.create(center.x + (this.headDiameter/2) * Math.cos(Math.PI * i / 3), center.y + (this.headDiameter/2) * Math.sin(Math.PI * i / 3),0);
                vertices.push(vertex);
            }
            for(i = 0; i < 6; i++) {
                sketch.sketchCurves.sketchLines.addByTwoPoints(vertices[(i+1) %6], vertices[i]);
            }

            var extrudes = newComp.features.extrudeFeatures;
            var prof = sketch.profiles.item(0);
            var extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation);

            var distance = adsk.core.ValueInput.createByReal(this.headHeight);
            extInput.setDistanceExtent(false, distance);
            var headExt = extrudes.add(extInput); 

            var fc = headExt.faces.item(0);
            var bd = fc.body;
            bd.name = this.boltName;

            //create the body
            var bodySketch = sketches.add(xyPlane);
            bodySketch.sketchCurves.sketchCircles.addByCenterRadius(center, this.bodyDiameter/2);

            var bodyProf = bodySketch.profiles.item(0);
            var bodyExtInput = extrudes.createInput(bodyProf, adsk.fusion.FeatureOperations.JoinFeatureOperation);

            bodyExtInput.setAllExtent(adsk.fusion.ExtentDirections.NegativeExtentDirection);
            bodyExtInput.setDistanceExtent(false, this.bodyLength);
            var bodyExt = extrudes.add(bodyExtInput); 
            
            // create chamfer
            var edgeCol = adsk.core.ObjectCollection.create();
            var edges = bodyExt.endFaces.item(0).edges;
            for(var iEdge = 0; iEdge < edges.count; iEdge++){
                edgeCol.add(edges.item(iEdge));
            }
            
            var chamferFeats = newComp.features.chamferFeatures;
            var chamferInput = chamferFeats.createInput(edgeCol, true);
            chamferInput.setToEqualDistance(this.chamferDistance);
            chamferFeats.add(chamferInput);
            
            // create fillet
            edgeCol.clear(0);
            var loops = headExt.endFaces.item(0).loops;
            var edgeLoop;
            for(var iEdgeLoop = 0; iEdgeLoop < loops.count; iEdgeLoop++){
                //since there two edgeloops in the start face of head, one consists of one circle edge while the other six edges
                edgeLoop = loops.item(iEdgeLoop);
                if(edgeLoop.edges.count == 1){
                    break;
                }
            }
            edgeCol.add(edgeLoop.edges.item(0));
            
            var filletFeats = newComp.features.filletFeatures;
            var filletInput = filletFeats.createInput();
            filletInput.addConstantRadiusEdgeSet(edgeCol, this.filletRadius, true);
            filletFeats.add(filletInput);

            //create revolve feature 1
            var revolveSketchOne = sketches.add(xzPlane);
            var radius = this.headDiameter/2;
            var point1 = revolveSketchOne.modelToSketchSpace(adsk.core.Point3D.create(center.x + radius*Math.cos(Math.PI/6), 0, center.y));
            var point2 = revolveSketchOne.modelToSketchSpace(adsk.core.Point3D.create(center.x + radius, 0, center.y));

            var point3 = revolveSketchOne.modelToSketchSpace(adsk.core.Point3D.create(point2.x, 0, (point2.x - point1.x) * Math.tan(this.cutAngle)));
            revolveSketchOne.sketchCurves.sketchLines.addByTwoPoints(point1, point2);
            revolveSketchOne.sketchCurves.sketchLines.addByTwoPoints(point2, point3);
            revolveSketchOne.sketchCurves.sketchLines.addByTwoPoints(point3, point1);

            //revolve feature 2
            var point4 = revolveSketchOne.modelToSketchSpace(adsk.core.Point3D.create(center.x + radius*Math.cos(Math.PI/6), 0, this.headHeight - center.y));
            var point5 = revolveSketchOne.modelToSketchSpace(adsk.core.Point3D.create(center.x + radius, 0, this.headHeight - center.y));
            var point6 = revolveSketchOne.modelToSketchSpace(adsk.core.Point3D.create(center.x + point2.x, 0,  this.headHeight - center.y - (point5.x - point4.x) * Math.tan(this.cutAngle))); 
            revolveSketchOne.sketchCurves.sketchLines.addByTwoPoints(point4, point5);
            revolveSketchOne.sketchCurves.sketchLines.addByTwoPoints(point5, point6);
            revolveSketchOne.sketchCurves.sketchLines.addByTwoPoints(point6, point4);

            var zaxis = newComp.zConstructionAxis;
            var revolves = newComp.features.revolveFeatures;
            var revProf1 = revolveSketchOne.profiles.item(0);
            var revInput1 = revolves.createInput(revProf1, zaxis, adsk.fusion.FeatureOperations.CutFeatureOperation);

            var revAngle = adsk.core.ValueInput.createByReal(Math.PI*2);
            revInput1.setAngleExtent(false,revAngle);
            revolves.add(revInput1);

            var revProf2 = revolveSketchOne.profiles.item(1);
            var revInput2 = revolves.createInput(revProf2, zaxis, adsk.fusion.FeatureOperations.CutFeatureOperation);

            //var revAngle = adsk.core.Value.createByReal(Math.PI*2);
            revInput2.setAngleExtent(false,revAngle);
            revolves.add(revInput2);
            
            var sideFace = bodyExt.sideFaces.item(0);
            var threadFeatures = newComp.features.threadFeatures;
            var threadDataQuery = threadFeatures.threadDataQuery;
            var defaultThreadType = threadDataQuery.defaultMetricThreadType;
            var designate = {};
            var threadClass = {};
            var isOk = threadDataQuery.recommendThreadData(this.bodyDiameter, false, defaultThreadType, designate, threadClass);
            if (isOk) {            
                var threadInfo = threadFeatures.createThreadInfo(false, defaultThreadType, designate.value, threadClass.value);
                var threadInput = threadFeatures.createInput(sideFace, threadInfo);
                threadFeatures.add(threadInput);
            }
        }; 
    };

    try {
        if (adsk.debug === true) {
            /*jslint debug: true*/
            debugger;
            /*jslint debug: false*/
        }
        var command = createCommandDefinition();
        var commandCreatedEvent = command.commandCreated;
        commandCreatedEvent.add(onCommandCreated);
        command.execute();
    } 
    catch (e) {
        if (ui) {
            ui.messageBox('Failed : ' + (e.description ? e.description : e));
        }
        
        adsk.terminate();
    }
}());
