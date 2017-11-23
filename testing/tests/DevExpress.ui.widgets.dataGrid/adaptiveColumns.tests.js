"use strict";

QUnit.testStart(function() {
    var markup =
        '<div>\
            <div class="dx-datagrid">\
                <div id="container"></div>\
                <div id="container2"></div>\
            </div>\
        </div>';
    $("#qunit-fixture").html(markup);
});

require("common.css!");
require("generic_light.css!");
require("ui/data_grid/ui.data_grid");

var $ = require("jquery"),
    devices = require("core/devices"),
    device = devices.real(),
    noop = require("core/utils/common").noop,
    dataGridMocks = require("../../helpers/dataGridMocks.js"),
    CLICK_NAMESPACE = "dxclick.dxDataGridAdaptivity";

function setupDataGrid(that, $dataGridContainer) {
    that.element = function() {
        return $dataGridContainer ? $dataGridContainer : $(".dx-datagrid");
    };

    if(that.columns !== null) {
        that.columns = that.columns || [
            { dataField: 'firstName', index: 0, allowEditing: true, allowExporting: true },
            { dataField: 'lastName', index: 1, allowEditing: true, allowExporting: true }
        ];
    }

    that.items = that.items || [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy" },
        { firstName: 'Super', lastName: "Star" }
    ];

    that.options = $.extend({}, {
        columns: that.columns,
        dataSource: {
            asyncLoadEnabled: false,
            store: that.items
        },
        columnHidingEnabled: true
    }, that.options);

    that.setupOptions = {
        initViews: true
    };

    dataGridMocks.setupDataGridModules(that, ['data', 'gridView', 'columns', 'columnHeaders', 'rows', 'editing', 'validating',
        'virtualScrolling', 'editorFactory', 'grouping', 'masterDetail', 'export', 'adaptivity', 'columnsResizingReordering', 'keyboardNavigation', 'summary', 'gridView'], that.setupOptions);
}

QUnit.module("AdaptiveColumns", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
});

QUnit.test("Show adaptive command column", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(this.columnsController.columnOption("command:adaptive", "visible"), "adaptive command column is visible");
    assert.notOk(this.columnsController.columnOption("command:adaptive", "adaptiveHidden"), "adaptive command is not hidden");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 2, "command adaptive element");
});

//T516888
QUnit.test("Column hiding should not work if column resizing enabled and columnResizingMode is widget", function(assert) {
    //arrange, act
    this.options = {
        allowColumnResizing: true,
        columnResizingMode: "widget"
    };
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(this.columnsController.columnOption("command:adaptive", "adaptiveHidden"), "adaptive command column is not shown");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 0, "no command adaptive element");
});

QUnit.test("Show adaptive command column when 'columnsHidingEnabled' is enabled", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.options = {
        columnHidingEnabled: false
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();
    this.options.columnHidingEnabled = true;
    this.adaptiveColumnsController.optionChanged({ name: "columnHidingEnabled", value: true });
    this.clock.tick();
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(this.columnsController.columnOption("command:adaptive", "visible"), "adaptive command column is shown");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 2, "command adaptive element");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 1, "hidden columns count");
});

QUnit.test("Correct column hiding with the fixed column", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(800);

    this.options = {
        columnHidingEnabled: true,
        showColumnHeaders: true
    };

    this.columns = [{
        dataField: "OrderNumber",
        caption: "Invoice Number",
        width: 100,
        fixed: true
    },
    {
        caption: "City",
        dataField: "StoreCity"
    },
    {
        caption: "State",
        dataField: "StoreState"
    }];

    this.items = [
        { OrderNumber: 1, StoreCity: "city1", StoreState: "state1" },
        { OrderNumber: 2, StoreCity: "city2", StoreState: "state2" }
    ];

    setupDataGrid(this);

    this.gridView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 0, "There is no hidden columns");
});

QUnit.test("Hide adaptive command column when 'columnsHidingEnabled' is disabled", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();
    this.options.columnHidingEnabled = false;
    this.adaptiveColumnsController.optionChanged({ name: "columnHidingEnabled", value: false });
    this.clock.tick();
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(this.columnsController.columnOption("command:adaptive", "adaptiveHidden"), "adaptive command column is hidden");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 0, "command adaptive element");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 0, "hidden columns count");
});

QUnit.test("Check ignoring of the selection's rowClick handler", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(!this.rowsView.isClickableElement($(".dx-data-row td").eq(1)), "row click isn't ignored");
    assert.ok(this.rowsView.isClickableElement($(".dx-data-row .dx-command-adaptive").first()), "row click is ignored");
});

function checkAdaptiveWidth(width) {
    return width === "0.0001px" || width === "0px";
}

QUnit.test("Hide the adaptive command column when all columns are shown", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-datagrid").width(600);
    this.resizingController.updateDimensions();
    this.clock.tick();

    var $cols = $(".dx-datagrid-rowsview col");

    //assert
    assert.ok(checkAdaptiveWidth($cols.get(2).style.width), "adaptive column is hidden");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 2, "command adaptive element");
});

QUnit.test("Hide the adaptive command column when it is located on a left side and all columns are shown", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();
    this.columnsController.columnOption("command:adaptive", "visibleIndex", -1);
    this.clock.tick();

    //act
    $(".dx-datagrid").width(600);
    this.resizingController.updateDimensions();
    this.clock.tick();

    var $cols = $(".dx-datagrid-rowsview col");

    //assert
    assert.ok(checkAdaptiveWidth($cols.get(0).style.width), "adaptive column is hidden");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 2, "command adaptive element");
});

QUnit.test("The last data column has correct width when 'columnAutoWidth' option is 'true'", function(assert) {
    //arrange
    $(".dx-datagrid").width(275);

    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'address', index: 2 },
        { dataField: 'country', index: 2 }
    ];

    this.options = {
        columnAutoWidth: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    var $cols = $(".dx-datagrid-rowsview col");

    //assert
    assert.ok(checkAdaptiveWidth($cols.get(2).style.width), "Third column is hidden");
    assert.ok(checkAdaptiveWidth($cols.get(3).style.width), "Fourth column is hidden");
});

//T402287
QUnit.test("Hidden columns must have zero widths for virtual scrolling table", function(assert) {
    //arrange
    $(".dx-datagrid").width(275);

    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'address', index: 2 },
        { dataField: 'country', index: 2 }
    ];

    this.options = {
        scrolling: {
            mode: "virtual"
        },
        columnAutoWidth: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    var $tables = $(".dx-datagrid-rowsview table");

    //assert
    assert.equal($tables.length, 2, "Table count");
    assert.ok(checkAdaptiveWidth($tables.eq(0).find("col").get(2).style.width), "Third column is hidden in first table");
    assert.ok(checkAdaptiveWidth($tables.eq(0).find("col").get(3).style.width), "Fourth column is hidden in first table");
    assert.ok(checkAdaptiveWidth($tables.eq(1).find("col").get(2).style.width), "Third column is hidden in second table");
    assert.ok(checkAdaptiveWidth($tables.eq(1).find("col").get(3).style.width), "Fourth column is hidden in second table");
});

//T402287
QUnit.test("Fitted column when width defined by user should not be hidden when horizontal scrolling is not shown", function(assert) {
    //arrange
    $(".dx-datagrid").width(1000);

    this.columns = [
        { dataField: 'firstName', index: 0, width: 100 },
        { dataField: 'lastName', index: 1, width: 100 }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    var $tables = $(".dx-datagrid-rowsview table");

    //assert
    assert.equal($tables.length, 1, "Table count");
    assert.ok(!checkAdaptiveWidth($tables.eq(0).find("col").get(0).style.width), "First column is not hidden");
    assert.ok(!checkAdaptiveWidth($tables.eq(0).find("col").get(1).style.width), "Second column is not hidden");
});

//T402287
QUnit.test("Column hiding when one column is grouped", function(assert) {
    //arrange
    $(".dx-datagrid").width(150);

    this.columns = [
        { dataField: 'firstName', index: 0, width: 100 },
        { dataField: 'lastName', index: 1, width: 100 },
        { dataField: 'grouped', index: 2, groupIndex: 0 }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    var $tables = $(".dx-datagrid-rowsview table");

    //assert
    assert.equal($tables.length, 1, "Table count");
    assert.ok(!checkAdaptiveWidth($tables.eq(0).find("col").get(0).style.width), "Grouped column is not hidden");
    assert.ok(!checkAdaptiveWidth($tables.eq(0).find("col").get(1).style.width), "First column is not hidden");
    assert.ok(checkAdaptiveWidth($tables.eq(0).find("col").get(2).style.width), "Second column is hidden");
});

QUnit.test("Width of adaptive command column is not should be changed when all groups is collapsed", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(400);
    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", sex: true },
        { firstName: 'SuperSuperSuperSuperSuperSuperSuper', lastName: "Star", sex: false }
    ];
    this.options = {
        showColumnHeaders: true,
        grouping: {
            autoExpandAll: true,
            allowCollapsing: true
        },
        columns: [
            { dataField: 'sex', index: 0, groupIndex: 0 },
            { dataField: 'firstName', index: 2 },
            { dataField: 'lastName', index: 1 }
        ]
    };
    setupDataGrid(this);
    var $container = $("#container");
    this.gridView.render($container);

    $(".dx-datagrid").width(100);
    this.resizingController.updateDimensions();
    this.clock.tick();
    var $cols = $(".dx-datagrid-rowsview col"),
        adaptiveHeadersWidth,
        adaptiveRowsWidth = $cols.eq($cols.length - 1).css("width");

    this.dataController.collapseAll();
    this.clock.tick();

    $cols = $(".dx-datagrid-headers col");
    adaptiveHeadersWidth = $cols.eq($cols.length - 1).css("width");

    //assert
    assert.equal(adaptiveRowsWidth, adaptiveHeadersWidth, "adaptive command column's width");
});

QUnit.test("Adaptive command column should not be displayed for a group summary row", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(400);
    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", sex: true },
        { firstName: 'Super', lastName: "Star", sex: false }
    ];
    this.options = {
        columns: [
            { dataField: 'firstName', index: 0 },
            { dataField: 'lastName', index: 1, groupIndex: 0 },
            { dataField: 'sex', index: 1 }
        ],
        grouping: {
            autoExpandAll: true
        },
        summary: {
            texts: {
                count: "Count = {0}"
            },
            groupItems: [{
                column: 'firstName',
                summaryType: 'count',
                showInGroupFooter: true
            }]
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();

    //assert
    assert.equal($(".dx-datagrid-group-footer .dx-datagrid-adaptive-more").length, 0, "Adaptive command column is not shown in a group footer");
});

QUnit.test("Show the adaptive command column when columns are generated from data source", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.columns = null;
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(this.columnsController.columnOption("command:adaptive", "visible"), "adaptive command column is shown");
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 2, "command adaptive element");
});
//
QUnit.test("Show the form when an adaptive row is expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick");

    //assert
    var form = $(".dx-master-detail-row .dx-form").data("dxForm");
    assert.ok(form !== undefined, "form is initialized");
    assert.equal(form.option("items")[0].column.dataField, "lastName", "dataField of column");
    assert.equal(form.option("items")[0].dataField, "lastName", "dataField of item");
    assert.equal($(".dx-field-item-content").text(), "Psy", "text of item");
});

QUnit.test("Text of form item is displayed in according with the displayExpr option of lookup", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: "lookup",
            lookup: {
                dataSource: [
                    { id: 1, name: "Test 1" },
                    { id: 2, name: "Test 2" }
                ],
                valueExpr: "id",
                displayExpr: "name"
            }
        }
    ];
    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", lookup: 1 },
        { firstName: 'Super', lastName: "Star", lookup: 1 }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    //assert
    var $fieldItemsContent = $(".dx-field-item-content");
    assert.equal($fieldItemsContent.eq(0).text(), "Psy", "text of lastName");
    assert.equal($fieldItemsContent.eq(1).text(), "Test 1", "text of lookup");
});

QUnit.test("Form items order is equal to the grid columns order", function(assert) {
    //arrange
    $(".dx-datagrid").width(100);

    this.items = [
            { firstName: "Alex", lastName: "Dow", city: "Washington" },
            { firstName: "John", lastName: "Pierce", city: "Oakwille" }
    ];

    this.options = {
        columns: [
            { dataField: "firstName", index: 0, visibleIndex: 2 },
            { dataField: "lastName", index: 1, visibleIndex: 0 },
            { dataField: "city", index: 2, visibleIndex: 1 }
        ]
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick");

    //assert
    var $formFieldLabels = $(".dx-master-detail-row .dx-form .dx-field-item-label");

    assert.equal($formFieldLabels.length, 2, "There are two hidden columns");

    assert.equal($formFieldLabels.first().text(), "City:", "first field is city");
    assert.equal($formFieldLabels.last().text(), "First Name:", "second field is first name");
});

QUnit.test("Form items were created readOnly if columns were readOnly", function(assert) {
    //arrange
    $(".dx-datagrid").width(100);

    this.items = [
            { firstName: "Alex", lastName: "Dow", city: "Washington", state: true },
            { firstName: "John", lastName: "Pierce", city: "Oakwille", state: false }
    ];

    this.options = {
        columnHidingEnabled: true,
    };

    this.columns = [
                { dataField: 'firstName', index: 0, allowEditing: true },
                { dataField: 'lastName', index: 1, allowEditing: true },
                { dataField: 'state', index: 2, allowEditing: true },
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick");

    //assert
    var checkbox = $(".dx-form .dx-checkbox").eq(0).dxCheckBox("instance");

    assert.ok(checkbox.option("readOnly"), "CheckBox was created readOnly");
});

QUnit.test("Update the adaptive detail form when column is hidden from api", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'middleName', index: 1 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Test Last Name", middleName: "Test Middle Name" },
        { firstName: "Test Name", lastName: "Test Last Name", middleName: "Test Middle Name" }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger(CLICK_NAMESPACE);
    this.columnsController.columnOption("lastName", "visible", false);
    this.clock.tick();

    //assert
    assert.equal($(".dx-form .dx-field-item-content").length, 1, "items count");
});

QUnit.test("Update the adaptive detail form when column is shown from api", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'middleName', index: 1 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Test Last Name", middleName: "Test Middle Name" },
        { firstName: "Test Name", lastName: "Test Last Name", middleName: "Test Middle Name" }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger(CLICK_NAMESPACE);
    this.columnsController.columnOption("lastName", "visible", false);
    this.clock.tick();
    this.columnsController.columnOption("lastName", "visible", true);
    this.clock.tick();

    //assert
    assert.equal($(".dx-form .dx-field-item-content").length, 2, "items count");
});

QUnit.test("Update adaptive state when all items are hidden inside a form", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'middleName', index: 1 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Test Last Name", middleName: "Test Middle Name" },
        { firstName: "Test Name", lastName: "Test Last Name", middleName: "Test Middle Name" }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger(CLICK_NAMESPACE);
    this.columnsController.columnOption("lastName", "visible", false);
    this.clock.tick();
    this.columnsController.columnOption("middleName", "visible", false);
    this.clock.tick();

    //assert
    assert.equal($(".dx-form .dx-field-item-content").length, 0, "items count");
    var cols = $("col");
    assert.ok(checkAdaptiveWidth(cols.get(cols.length - 1).style.width), "adaptive command column is hidden");
});

QUnit.test("Update adaptive state when adaptive command column is located on left side", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'middleName', index: 1 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Test Last Name", middleName: "Test Middle Name" },
        { firstName: "Test Name", lastName: "Test Last Name", middleName: "Test Middle Name" }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.columnsController.columnOption("command:adaptive", "visibleIndex", -1);
    this.clock.tick();
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger(CLICK_NAMESPACE);
    this.columnsController.columnOption("lastName", "visible", false);
    this.clock.tick();
    this.columnsController.columnOption("middleName", "visible", false);
    this.clock.tick();

    //assert
    var cols = $("col");
    assert.ok(checkAdaptiveWidth(cols.get(0).style.width), "adaptive command column is hidden");
});

QUnit.test("Show the form with cellTemplate when an adaptive row is expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    var _column;
    this.columns = [
        {
            dataField: 'firstName',
            index: 0,
            allowEditing: true
        },
        {
            dataField: 'lastName',
            index: 1,
            allowEditing: true,
            cellTemplate: function($container, data) {
                _column = data.column;
                $container.text(data.value + " template");
            }
        }
    ];
    setupDataGrid(this);

    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick");

    //assert
    var form = $(".dx-master-detail-row .dx-form").data("dxForm");
    assert.ok(form !== undefined, "form is initialized");
    assert.equal(form.option("items")[0].column.dataField, "lastName", "dataField of column");
    assert.equal(form.option("items")[0].dataField, "lastName", "dataField of item");
    assert.equal($(".dx-field-item-content").text(), "Psy template", "template text of item");
    assert.equal(_column.dataField, "lastName", "column of data argument in cellTemplate");
});

QUnit.test("Hide the form widget when an adaptive row is collapsed", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick.dxDataGridAdaptivity");
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick.dxDataGridAdaptivity");

    //assert
    assert.equal($(".dx-master-detail-row .dx-form").length, 0);
});

QUnit.test("Hide the form widget when an adaptive row has an empty data", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick.dxDataGridAdaptivity");
    $(".dx-datagrid").width(600);
    this.resizingController.updateDimensions();
    this.clock.tick();

    var $cols = $(".dx-datagrid-rowsview col");

    //assert
    assert.ok(checkAdaptiveWidth($cols.get(2).style.width), "adaptive column is hidden");
    assert.equal($(".dx-master-detail-row .dx-form").length, 0);
});

QUnit.test("Check calculateCellValue of column for form's item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.columns = [
        { dataField: 'firstName', index: 0 },
        {
            dataField: 'lastName',
            index: 1,
            calculateCellValue: function(rowData) {
                return rowData.firstName + " " + rowData.lastName;
            } }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick.dxDataGridAdaptivity");

    //assert
    assert.equal($(".dx-field-item-content").first().text(), "Blablablablablablablablablabla Psy", "text of item");
});

QUnit.test("Check the format and the customizeText options for a column inside form's item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0 },
            {
                dataField: 'count',
                index: 1,
                format: "percent",
                customizeText: function(cellInfo) {
                    return cellInfo.valueText + " test";
                }
            }
        ],
        dataSource: {
            asyncLoadEnabled: false,
            store: [
                { firstName: 'Blablablablablablablablablabla', count: 0.2 },
                { firstName: 'Super', count: 0.5 }
            ]
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-data-row .dx-datagrid-adaptive-more").first().trigger("dxclick.dxDataGridAdaptivity");

    //assert
    assert.equal($(".dx-field-item-content").first().text(), "20% test", "text of item");
});

QUnit.test("Skip a hidden columns from pointsByColumns when resizing is enabled and hidden columns are located at the beginning", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'lastName', index: 0, hidingPriority: 0, width: 100 },
        { dataField: 'middleName', index: 1, hidingPriority: 1, width: 100 },
        { dataField: 'firstName', index: 2, width: 100 },
        { dataField: 'profession', index: 3, width: 100 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", middleName: "FFF", profession: "bla" },
        { firstName: 'Super', lastName: "Star", middleName: "Eewrew", profession: "hero" },
        { firstName: 'Andrew', lastName: "K", middleName: "KKKK", profession: "wheel" }
    ];

    this.options = {
        allowColumnResizing: true,
        showColumnHeaders: true
    };
    setupDataGrid(this);
    var $container = $("#container");
    this.columnHeadersView.render($container);
    this.rowsView.render($container);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.deepEqual(this.columnsResizerController.pointsByColumns(), [{
        "columnIndex": 2,
        "index": 3,
        "x": -9900,
        "y": -10000
    }], "points by columns");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 2, "hidden columns count");
});

QUnit.test("Skip a hidden columns from pointsByColumns when resizing is enabled and hidden columns are located at the end", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1 },
        { dataField: 'profession', index: 2 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", profession: "bla" },
        { firstName: 'Super', lastName: "Star", profession: "hero" },
        { firstName: 'Andrew', lastName: "K", profession: "wheel" }
    ];

    this.options = {
        allowColumnResizing: true,
        showColumnHeaders: true
    };
    setupDataGrid(this);
    var $container = $("#container");
    this.columnHeadersView.render($container);
    this.rowsView.render($container);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.deepEqual(this.columnsResizerController.pointsByColumns(), [], "points by columns");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 2, "hidden columns count");
});

QUnit.test("Skip a hidden columns from pointsByColumns when resizing is enabled and hidden columns are located in the middle", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'lastName', index: 0 },
        { dataField: 'firstName', index: 1, hidingPriority: 1 },
        { dataField: 'profession', index: 2, hidingPriority: 0 },
        { dataField: 'description', index: 3 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", profession: "bla", description: "test test" },
        { firstName: 'Super', lastName: "Star", profession: "hero", description: "test test test test" },
        { firstName: 'Andrew', lastName: "K", profession: "wheel", description: "test test test" }
    ];

    this.options = {
        allowColumnResizing: true,
        showColumnHeaders: true
    };
    setupDataGrid(this);
    var $container = $("#container");
    this.columnHeadersView.render($container);
    this.rowsView.render($container);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.deepEqual(this.columnsResizerController.pointsByColumns().length, 1, "points by columns count");
    assert.deepEqual(this.columnsResizerController.pointsByColumns()[0].columnIndex, 0, "column index of point");
    assert.deepEqual(this.columnsResizerController.pointsByColumns()[0].index, 1, "index of point");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 2, "hidden columns count");
});

QUnit.test("Skip a hidden columns from pointsByColumns when reordering is enabled", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0, allowReordering: true },
        { dataField: 'lastName', index: 1, allowReordering: true },
        { dataField: 'profession', index: 2, allowReordering: true }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", profession: "bla" },
        { firstName: 'Super', lastName: "Star", profession: "hero" },
        { firstName: 'Andrew', lastName: "K", profession: "wheel" }
    ];

    this.options = {
        showColumnHeaders: true
    };
    setupDataGrid(this);
    var $container = $("#container");
    this.columnHeadersView.render($container);
    this.rowsView.render($container);
    this.draggingHeaderView.render($container);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    var that = this;
    this.draggingHeaderView._dragOptions = {
        rowIndex: 0,
        sourceColumn: that.columns[0]
    };
    this.draggingHeaderView._dropOptions = {
        targetLocation: {}
    };
    this.draggingHeaderView._getDraggingPanelByPos = function() {
        return that.columnHeadersView;
    };
    this.draggingHeaderView.dockHeader({});

    //assert
    assert.equal(this.draggingHeaderView._testPointsByColumns.length, 2, "points by columns count");
    assert.equal(this.draggingHeaderView._testPointsByColumns[0].index, 0, "first point index");
    assert.equal(this.draggingHeaderView._testPointsByColumns[1].index, 3, "second point index");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 2, "hidden columns count");
});

QUnit.test("Resize column when hidden columns are located in the middle ", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.columns = [
        { dataField: 'firstName', index: 0, width: 100 },
        { dataField: 'lastName', index: 1, hidingPriority: 1, width: 100 },
        { dataField: 'profession', index: 2, hidingPriority: 0, width: 100 },
        { dataField: 'description', index: 3, width: 100 }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", profession: "bla", description: "test test" },
        { firstName: 'Super', lastName: "Star", profession: "hero", description: "test test test test" },
        { firstName: 'Andrew', lastName: "K", profession: "wheel", description: "test test test" }
    ];

    this.options = {
        allowColumnResizing: true,
        showColumnHeaders: true
    };
    setupDataGrid(this);
    var $container = $("#container");
    this.columnHeadersView.render($container);
    this.rowsView.render($container);
    this.columnsSeparatorView.render($container);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.columnsResizerController._isResizing = true;
    this.columnsResizerController._$parentContainer = $container;
    this.columnsResizerController._targetPoint = { columnIndex: 0 };
    this.columnsResizerController._setupResizingInfo(-9900);
    this.columnsResizerController._moveSeparator({
        jQueryEvent: {
            data: this.columnsResizerController,
            type: 'mousemove',
            pageX: -9840,
            preventDefault: noop,
            stopPropagation: noop
        }
    });

    //assert
    var $cols = $(".dx-datagrid-headers col");
    assert.equal(this.adaptiveColumnsController.getHiddenColumns().length, 2, "hidden columns count");
    assert.equal($cols.get(0).style.width, "160px", "1 column width");
    assert.ok(checkAdaptiveWidth($cols.get(1).style.width), "2 column width");
    assert.ok(checkAdaptiveWidth($cols.get(2).style.width), "3 column width");
    assert.equal($cols.get(3).style.width, "40px", "4 column width");
});

QUnit.test("Export a hidden columns with bestFitWidth option", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.columns[0].width = 200;
    this.columns[1].width = 200;
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    var columns = this.exportController._getColumns(),
        visibleColumns = this.columnsController.getVisibleColumns(),
        hiddenColumns = this.adaptiveColumnsController.getHiddenColumns();

    //assert
    assert.equal(hiddenColumns.length, 1, "hidden columns count");
    assert.equal(columns[1][1].dataField, hiddenColumns[0].dataField, "hidden column's dataField");
    assert.equal(columns[1][1].width, visibleColumns[1].bestFitWidth, "hidden column's width");
});

QUnit.test("ShowEditorAlways option for form's item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1, showEditorAlways: true }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.clock.tick();

    //assert
    var $editors = $(".dx-form .dx-texteditor"),
        editor = $editors.first().data("dxTextBox");

    assert.equal($editors.length, 1, "editors count");
    assert.equal(editor.option("value"), "Psy", "editor's value");
    assert.ok(editor.option("readOnly"), "readOnly option of editor");
});

QUnit.test("Apply the css styles for a hidden columns inside the rows view", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var col = $(".dx-datagrid-rowsview table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-rowsview table td");

    assert.ok(checkAdaptiveWidth(col.style.width));
    assert.ok($cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

QUnit.test("Remove the css styles from a hidden columns inside the rows view", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-datagrid").width(600);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var col = $(".dx-datagrid-rowsview table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-rowsview table td");

    assert.ok(!checkAdaptiveWidth(col.style.width));
    assert.ok(!$cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

QUnit.test("Apply the css styles for a hidden columns inside the column headers view", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.options = { showColumnHeaders: true };
    setupDataGrid(this);
    this.columnHeadersView.render($("#container"));
    this.rowsView.render($("#container2"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var col = $(".dx-datagrid-headers table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-headers table td");

    assert.ok(checkAdaptiveWidth(col.style.width));
    assert.ok($cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

//T507252
QUnit.test("Apply the css styles for a hidden columns inside the column headers view with bands", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.options = { showColumnHeaders: true };
    this.columns = [{ dataField: "test", hidingPriority: 0 }, { caption: "Band", columns: ["firstName", { dataField: "lastName", hidingPriority: 1 }] }];

    setupDataGrid(this);
    this.columnHeadersView.render($("#container"));
    this.rowsView.render($("#container2"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var $cols = $(".dx-datagrid-headers table").eq(0).find("col"),
        $headerRows = $(".dx-datagrid-headers .dx-header-row");

    assert.ok(checkAdaptiveWidth($cols.get(0).style.width), "first column is hidden");
    assert.notOk(checkAdaptiveWidth($cols.get(1).style.width), "second column is not hidden");
    assert.ok(checkAdaptiveWidth($cols.get(2).style.width), "third column is hidden");
    assert.equal($headerRows.length, 2, "two header rows");
    assert.ok($headerRows.eq(0).children().eq(0).hasClass("dx-datagrid-hidden-column"), "first cell in first header row is hidden");
    assert.ok($headerRows.eq(1).children().eq(1).hasClass("dx-datagrid-hidden-column"), "second cell in second header row is hidden");
    assert.equal($headerRows.find(".dx-datagrid-hidden-column").length, 2, "only two cells in header rows are hidden");
});

QUnit.test("Remove the css styles from a hidden columns inside the column headers view", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = { showColumnHeaders: true };
    setupDataGrid(this);
    this.columnHeadersView.render($("#container"));
    this.rowsView.render($("#container2"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-datagrid").width(600);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var col = $(".dx-datagrid-headers table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-headers table td");

    assert.ok(!checkAdaptiveWidth(col.style.width));
    assert.ok(!$cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

QUnit.test("Apply the css styles for a hidden columns inside the summary view", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    this.options = {
        summary: {
            totalItems: [{
                column: 'lastName',
                summaryType: 'count'
            }]
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.footerView.render($("#container2"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var col = $(".dx-datagrid-total-footer table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-total-footer table td");

    assert.ok(checkAdaptiveWidth(col.style.width));
    assert.ok($cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

QUnit.test("Remove the css styles from a hidden columns inside the summary view", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        summary: {
            totalItems: [{
                column: 'lastName',
                summaryType: 'count'
            }]
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.footerView.render($("#container2"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-datagrid").width(600);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    var col = $(".dx-datagrid-total-footer table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-total-footer table td");

    assert.ok(!checkAdaptiveWidth(col.style.width));
    assert.ok(!$cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

QUnit.test("Apply the hidden css class for the command adaptive column", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(600);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-command-adaptive.dx-command-adaptive-hidden").length, 2);
});

QUnit.test("Remove the hidden css class from the command adaptive column", function(assert) {
    //arrange
    $(".dx-datagrid").width(600);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    $(".dx-datagrid").width(200);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-command-adaptive.dx-command-adaptive-hidden").length, 0);
});

QUnit.test("The css styles for a hidden columns are not applied before calculating the bestFitWidth", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    var $hiddenColumns;
    this.resizingController._getBestFitWidths = function() {
        $hiddenColumns = $(".dx-datagrid-hidden-column");
        return [];
    };

    //act
    $(".dx-datagrid").width(250);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($hiddenColumns.length, 0);
});

QUnit.test("Cell of master detail is not hidden when first column of data grid is hidden", function(assert) {
    //arrange
    $(".dx-datagrid").width(600);
    this.columns = [
        { dataField: 'firstName', index: 1, hidingPriority: 0 },
        { dataField: 'lastName', index: 0, hidingPriority: 1 }
    ];

    setupDataGrid(this);
    this.options.masterDetail = {
        enabled: true,
        template: function(container) {
            $("<span/>").appendTo(container);
        }
    };
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.dataController.expandRow(this.items[0]);
    $(".dx-datagrid").width(200);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-master-detail-row .dx-master-detail-cell.dx-datagrid-hidden-column").length, 0, "master detail cell is not hidden");
});

QUnit.test("Adaptive command column should be shown when columns contains banded columns", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 1 },
        { dataField: 'lastName', index: 0 },
        { caption: "band", columns: [{ dataField: "band", index: 2 }] }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", band: "test banded column 1" },
        { firstName: 'Super', lastName: "Star", band: "test banded column 2" }
    ];

    setupDataGrid(this);

    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-data-row .dx-command-adaptive:not(.dx-datagrid-hidden-column)").length, 2, "the adaptive column is shown");
});

QUnit.test("Not display adaptive command column when it is invisible via option", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.columnsController.columnOption("command:adaptive", "visible", false);
    this.clock.tick();

    //assert
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 0, "command adaptive element");
});

QUnit.test("Render a view template for item of adaptive form  when other columns are hiding", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.columns = [
        { dataField: 'firstName', index: 0, allowEditing: true, allowExporting: true },
        { dataField: 'lastName', index: 2, allowEditing: true, allowExporting: true },
        { dataField: 'template', index: 1, allowEditing: true, allowExporting: true,
            cellTemplate: function(container) {
                $("<div>")
                    .addClass("test-template")
                    .appendTo(container);
            }
        }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    $(".dx-datagrid").width(500);
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-adaptive-detail-row .test-template").length, 1, "cell template is shown");
});

//T519926
QUnit.test("Calculate correct an average width of column when some columns has no width", function(assert) {
    //arrange
    $(".dx-datagrid").width(800);

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", FixedColumn1: "Fixed Column 1", FixedColumn2: "Fixed Column 2" },
        { firstName: 'Super', lastName: "Star", FixedColumn1: "Fixed Column 1", FixedColumn2: "Fixed Column 2" }
    ];

    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1, width: 100 },
        { dataField: 'FixedColumn1', index: 2 },
        { dataField: 'FixedColumn2', index: 3, width: 150 }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-data-row .dx-command-adaptive.dx-command-adaptive-hidden").length, 2, "command adaptive element");
});

QUnit.test("Calculate an average width of column when column has width as string", function(assert) {
    //arrange
    $(".dx-datagrid").width(800);

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", FixedColumn1: "Fixed Column 1", FixedColumn2: "Fixed Column 2" },
        { firstName: 'Super', lastName: "Star", FixedColumn1: "Fixed Column 1", FixedColumn2: "Fixed Column 2" }
    ];

    this.columns = [
        { dataField: 'firstName', index: 0 },
        { dataField: 'lastName', index: 1, width: "100px" },
        { dataField: 'FixedColumn1', index: 2 },
        { dataField: 'FixedColumn2', index: 3, width: 150 }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-data-row .dx-command-adaptive.dx-command-adaptive-hidden").length, 2, "command adaptive element should be hidden");
});

QUnit.test("Calculate correct an average width of column when some columns has percent width", function(assert) {
    //arrange
    $(".dx-datagrid").width(700);

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy", FixedColumn1: "Fixed Column 1", FixedColumn2: "Fixed Column 2" },
        { firstName: 'Super', lastName: "Star", FixedColumn1: "Fixed Column 1", FixedColumn2: "Fixed Column 2" }
    ];

    this.columns = [
        { dataField: 'firstName', index: 0, width: "50%" },
        { dataField: 'lastName', index: 1 },
        { dataField: 'FixedColumn1', index: 2 },
        { dataField: 'FixedColumn2', index: 3 }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.equal($(".dx-data-row .dx-datagrid-adaptive-more").length, 2, "command adaptive element");
});

QUnit.test("Apply a hidden css class on cell prepared event of rows view", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);
    this.editingController.cancelEditData();

    //assert
    var col = $(".dx-datagrid-rowsview table").eq(0).find("col").get(1),
        $cells = $(".dx-datagrid-rowsview table td");

    assert.ok(checkAdaptiveWidth(col.style.width));
    assert.ok($cells.eq(1).hasClass("dx-datagrid-hidden-column"));
});

QUnit.test("Row elements are should get only once when CSS for hidden column is applied", function(assert) {
    //arrange, act
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    sinon.spy(this.rowsView, "_getRowElements");
    this.resizingController.updateDimensions();
    this.clock.tick();

    //assert
    assert.ok(this.rowsView._getRowElements.calledOnce);
});

QUnit.module("API", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
});

QUnit.test("Expand adaptive row", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.clock.tick();

    //assert
    assert.ok($(".dx-adaptive-detail-row").length, "render field items");
});

QUnit.test("Collapse adaptive row", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.clock.tick();

    assert.ok($(".dx-adaptive-detail-row").length, "render field items");

    this.adaptiveColumnsController.collapseAdaptiveDetailRow();
    this.clock.tick();

    assert.ok(!$(".dx-adaptive-detail-row").length, "there is no field items");
});

QUnit.test("Is adaptive row expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.clock.tick();

    //assert
    assert.ok(this.adaptiveColumnsController.isAdaptiveDetailRowExpanded(this.items[0]), "row is expanded");

    //act
    this.adaptiveColumnsController.collapseAdaptiveDetailRow(this.items[0]);
    this.clock.tick();

    //assert
    assert.ok(!this.adaptiveColumnsController.isAdaptiveDetailRowExpanded(this.items[0]), "row is collapsed");
});

QUnit.test("Collapse adaptive row for one item in data source_T375776", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy" }
    ];

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.adaptiveColumnsController.collapseAdaptiveDetailRow();
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.adaptiveColumnsController.collapseAdaptiveDetailRow();

    assert.ok(!$(".dx-adaptive-detail-row").length, "there is no field items");
});

QUnit.test("Show the adaptive detail row when the master detail row is expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.options.masterDetail = {
        enabled: true,
        template: function(container) {
            $("<span/>")
                .text("test")
                .addClass("dx-detail-test")
                .appendTo(container);
        }
    };
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.dataController.expandRow(this.items[0]);
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    var $rows = $(".dx-master-detail-row");

    //assert
    assert.equal($rows.length, 2, "master detail rows count");
    assert.ok($rows.eq(0).hasClass("dx-adaptive-detail-row"), "adaptive detail row");
    assert.ok(!$rows.eq(1).hasClass("dx-adaptive-detail-row"), "master detail row");
});

QUnit.test("Show the master detail row when the adaptive detail row is expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.options.masterDetail = {
        enabled: true,
        template: function(container) {
            $("<span/>")
                .text("test")
                .addClass("dx-detail-test")
                .appendTo(container);
        }
    };
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.dataController.expandRow(this.items[0]);
    var $rows = $(".dx-master-detail-row");

    //assert
    assert.equal($rows.length, 2, "master detail rows count");
    assert.ok($rows.eq(0).hasClass("dx-adaptive-detail-row"), "adaptive detail row");
    assert.ok(!$rows.eq(1).hasClass("dx-adaptive-detail-row"), "master detail row");
});

QUnit.test("Hide the adaptive detail row when the master detail row is expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.options.masterDetail = {
        enabled: true,
        template: function(container) {
            $("<span/>")
                .text("test")
                .addClass("dx-detail-test")
                .appendTo(container);
        }
    };
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.dataController.expandRow(this.items[0]);
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.adaptiveColumnsController.collapseAdaptiveDetailRow(this.items[0]);
    var $rows = $(".dx-master-detail-row");

    //assert
    assert.equal($rows.length, 1, "master detail rows count");
    assert.ok(!$rows.eq(0).hasClass("dx-adaptive-detail-row"), "adaptive detail row");
});

QUnit.test("Hide the adaptive and master detail row", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    setupDataGrid(this);
    this.options.masterDetail = {
        enabled: true,
        template: function(container) {
            $("<span/>")
                .text("test")
                .addClass("dx-detail-test")
                .appendTo(container);
        }
    };
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.dataController.expandRow(this.items[0]);
    this.dataController.collapseRow(this.items[0]);
    this.adaptiveColumnsController.collapseAdaptiveDetailRow(this.items[0]);
    var $rows = $(".dx-master-detail-row");

    //assert
    assert.equal($rows.length, 1, "master detail rows count");
    assert.ok($rows.eq(0).css("display") === "none", "master detail row");
});

QUnit.module("Editing", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
});

QUnit.test("Edit form. Check that adaptive form is hidden", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: "form",
            allowUpdating: true,
            texts: {
                editRow: "Edit"
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.clock.tick();

    var adaptiveDetailForm = $(".dx-adaptive-detail-row .dx-form").data("dxForm");
    assert.ok(adaptiveDetailForm !== undefined, "adaptive detail form is initialized");

    this.editingController.editRow(0);
    this.clock.tick();

    adaptiveDetailForm = $(".dx-adaptive-detail-row .dx-form").data("dxForm");
    assert.ok(adaptiveDetailForm === undefined, "adaptive detail form is not initialized");
});

//T458653
QUnit.test("Edit form. Editors of hidden columns are visible", function(assert) {
    //arrange
    var $formItemElements;

    this.options = {
        editing: {
            mode: "form",
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.editingController.editRow(0);
    this.clock.tick();

    //act
    $(".dx-datagrid").width(100);
    this.resizingController.updateDimensions();
    this.clock.tick();

    $formItemElements = $("#container").find(".dx-datagrid-edit-form").first().find(".dx-datagrid-edit-form-item");
    assert.equal($formItemElements.length, 2, "count editor");
    assert.notOk($formItemElements.first().hasClass("dx-datagrid-hidden-column"), "editor is visible");
    assert.notOk($formItemElements.last().hasClass("dx-datagrid-hidden-column"), "editor is visible");
});

//T529028
QUnit.test("Edit popup form. Check that adaptive form is hidden when adding row", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: "popup",
            allowUpdating: true,
            texts: {
                editRow: "Edit"
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();

    //assert
    assert.strictEqual($("#container").find(".dx-adaptive-detail-row").length, 0, "hasn't adaptive detail row");
});

//T529028
QUnit.test("Edit popup form. Check that adaptive form is hidden when editing row", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: "popup",
            allowUpdating: true,
            texts: {
                editRow: "Edit"
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);
    this.editingController.cancelEditData();

    //assert
    assert.strictEqual($("#container").find(".dx-adaptive-detail-row").length, 0, "hasn't adaptive detail row");
});

QUnit.test("Edit row", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();

    //act
    this.editingController.editRow(0);

    //assert
    var form = $(".dx-master-detail-row .dx-form").data("dxForm"),
        $editors = $(".dx-texteditor"),
        editor1 = $editors.eq(0).dxTextBox("instance"),
        editor2 = $editors.eq(2).dxTextBox("instance");

    assert.ok(form !== undefined, "form is initialized");
    assert.equal($editors.length, 3, "editors count");
    assert.equal(editor2.option("value"), "Psy", "editor's value");

    //act
    editor1.option("value", "Man");
    editor2.option("value", "Girl");
    this.editingController.saveEditData();

    //assert
    form = $(".dx-master-detail-row .dx-form").data("dxForm");
    $editors = $(".dx-texteditor");

    assert.ok(form === undefined, "form is not initialized");
    assert.equal($editors.length, 0, "editors count");
    assert.equal($(".dx-editor-cell").length, 0, "the editor cell class is not applied");
});

QUnit.test("Edit row. Cascade update detailAdaptive row when modify data row", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        customizeColumns: function(columns) {
            columns[0].setCellValue = function(data, value) {
                data.lastName = value + " Test";
                this.defaultSetCellValue(data, value);
            };
        },
        editing: {
            mode: 'row',
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();

    this.editingController.editRow(0);

    var editor = $(".dx-texteditor").eq(0).dxTextBox("instance");

    //act
    editor.option("value", "Man");

    //assert
    var $editors = $(".dx-texteditor");

    assert.equal($editors.length, 3, "editors count");
    assert.equal($editors.eq(0).dxTextBox("instance").option("value"), "Man", "the editor value");
    assert.equal($editors.eq(2).dxTextBox("instance").option("value"), "Man Test", "the cascade editor value");
    assert.equal($editors.eq(2).closest(".dx-adaptive-detail-row").length, 1, "the cascade editor is in adaptive detail row");
});

QUnit.test("Edit row. Cascade update data row when modify detailAdaptive row", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        customizeColumns: function(columns) {
            columns[1].setCellValue = function(data, value) {
                data.firstName = value + " Cascade";
                this.defaultSetCellValue(data, value);
            };
        },
        editing: {
            mode: 'row',
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();

    this.editingController.editRow(0);

    var editor = $(".dx-texteditor").eq(2).dxTextBox("instance");

    //act
    editor.option("value", "Man");

    //assert
    var $editors = $(".dx-texteditor");

    assert.equal($editors.length, 3, "editors count");
    assert.equal($editors.eq(2).dxTextBox("instance").option("value"), "Man", "the editor value");
    assert.equal($editors.eq(0).dxTextBox("instance").option("value"), "Man Cascade", "the cascade editor value");
    assert.equal($editors.eq(0).closest(".dx-data-row").length, 1, "the cascade editor is in data row");
});

QUnit.test("Edit row. Check repeat edit", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);

    var form,
        $editors = $(".dx-texteditor"),
        editor1 = $editors.eq(0).dxTextBox("instance"),
        editor2 = $editors.eq(2).dxTextBox("instance");

    editor1.option("value", "Man");
    editor2.option("value", "Girl");
    this.editingController.saveEditData();
    this.editingController.editRow(0);

    //assert
    form = $(".dx-master-detail-row .dx-form").data("dxForm");
    $editors = $(".dx-texteditor");

    assert.ok(form !== undefined, "form is initialized");
    assert.equal($editors.length, 3, "editors count");
});

QUnit.test("Edit row. Texts inside the form widget is rendered when editing data is saved", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);

    var $editors = $(".dx-texteditor"),
        editor1 = $editors.eq(0).dxTextBox("instance"),
        editor2 = $editors.eq(1).dxTextBox("instance");

    editor1.option("value", "Man");
    editor2.option("value", "Girl");
    this.editingController.saveEditData();
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    //assert
    assert.equal($(".dx-field-item-content").text(), "Girl", "text of item");
});

QUnit.test("Edit row. Editor is not rendered inside the form widget when clicked on text of form's item", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    var $itemContent = $(".dx-field-item-content"),
        form = $(".dx-master-detail-row .dx-form").data("dxForm");

    $itemContent.trigger("dxclick");

    //assert
    assert.ok(form !== undefined, "form is initialized");
    assert.equal($(".dx-texteditor").length, 0, "editors count");
});

QUnit.test("Edit row. Adaptive detail row is not expanded for other rows when a some row is edited", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);

    //assert
    var $rows = $(".dx-row");
    assert.ok($rows.eq(1).hasClass("dx-adaptive-detail-row"), "second row is adaptive detail");

    //act
    this.editingController.editRow(2);

    //assert
    $rows = $(".dx-row");
    assert.ok(!$rows.eq(1).hasClass("dx-adaptive-detail-row"), "second row is not adaptive detail");
    assert.ok($rows.eq(2).hasClass("dx-adaptive-detail-row"), "third row is adaptive detail");
});

QUnit.test("Check 'onAdaptiveDetailRowPreparing' action", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    var isCustomizeItemCalled,
        isContentReadyCalled;

    this.options = {
        onAdaptiveDetailRowPreparing: function(args) {
            var formOptions = args.formOptions;
            formOptions.colCount = 5;
            formOptions.items[0].label = { text: "LaLa" };
            formOptions.customizeItem = function() {
                isCustomizeItemCalled = true;
            };
            formOptions.onContentReady = function() {
                isContentReadyCalled = true;
            };
        },
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    var $itemContent = $(".dx-field-item-content"),
        form = $(".dx-master-detail-row .dx-form").data("dxForm");

    $itemContent.trigger("dxclick");

    //assert
    assert.ok(form.option("colCount"), 5, "colCount of form");
    assert.equal(form.option("items[0].label.text"), "LaLa", "text of item's label");
    assert.ok(isContentReadyCalled, "customer's content ready is called");
    assert.ok(isCustomizeItemCalled, "customer's customize item func is called");
});

QUnit.test("Edit row. Editors are rendered inside the form widget when the adaptive row is expanded", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.editingController.editRow(0);

    var form = $(".dx-master-detail-row .dx-form").data("dxForm");

    //assert
    assert.ok(form !== undefined, "form is initialized");
    assert.equal($(".dx-texteditor").length, 3, "editors count");
});

QUnit.test("Edit row. The adaptive row is not collapsed when editing is complete and this row is expanded before editing", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.editingController.editRow(0);
    this.editingController.cancelEditData();

    //assert
    assert.ok(this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is expanded");
    assert.equal($(".dx-texteditor").length, 0, "editors count");
});

QUnit.test("Edit row. The adaptive row is not expanded when editing is canceled", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);
    this.editingController.cancelEditData();

    //assert
    assert.ok(!this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is collapsed");
});

QUnit.test("Edit row. The adaptive row is not expanded when editing is canceled", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);
    this.editingController.cancelEditData();

    //assert
    assert.ok(!this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is collapsed");
});

QUnit.test("Edit row. The adaptive row is not collapsed when editing is canceled and row is expanded before editing", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.editingController.editRow(0);
    this.editingController.cancelEditData();

    //assert
    assert.ok(this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is not collapsed");
});

QUnit.test("Edit row. The adaptive detail row is collapsed when an other row is edited", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    this.editingController.editRow(2);

    //assert
    var $form = $(".dx-master-detail-row .dx-form"),
        $editors = $form.find(".dx-texteditor");

    assert.equal($form.length, 1, "form element");
    assert.equal($editors.length, 1, "editor's count");
    assert.equal($editors.eq(0).data("dxTextBox").option("value"), "Star", "editor's value");
});

QUnit.test("Edit row. Expand the adaptive detail row when an other row is edited", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);
    this.adaptiveColumnsController.toggleExpandAdaptiveDetailRow(this.items[1]);

    //assert
    var $form = $(".dx-master-detail-row .dx-form"),
        $editors = $form.find(".dx-texteditor");

    assert.equal($form.length, 1, "form element");
    assert.equal($editors.length, 0, "editor's count");
});

QUnit.test("Edit row. ShowEditorAlways option for form's item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.columns = [
        { dataField: 'firstName', index: 0, allowEditing: true },
        { dataField: 'lastName', index: 1, showEditorAlways: true, allowEditing: true }
    ];
    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.editRow(0);
    this.clock.tick();

    //assert
    var $editors = $(".dx-form .dx-texteditor"),
        editor = $editors.first().data("dxTextBox");

    assert.equal($editors.length, 1, "editors count");
    assert.ok(!editor.option("readOnly"), "editor has not readOnly mode");
});

QUnit.test("Focus input for not row editing", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    sinon.spy(this.editingController, "_delayedInputFocus");
    $(".dx-field-item-content").first().trigger("dxclick");
    this.clock.tick();

    //assert
    assert.equal(this.editingController._delayedInputFocus.callCount, 1, "editor is focused");
});

QUnit.test("Edit batch. Render editor of form's item when clicked on a text of item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    $(".dx-field-item-content").first().trigger("dxclick");

    //assert
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
    assert.equal($(".dx-editor-cell").length, 0, "the editor cell class is not applied"); //dx-highlight-outline
    assert.equal($(".dx-highlight-outline").length, 0, "the highlight outline class is not applied");
});

QUnit.test("Edit batch. Editor is rendered only one when click on text", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content");

    //assert
    assert.equal($itemsContent.length, 2, "items count");

    //act
    $itemsContent.last().trigger("dxclick");

    //assert
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
    var editor = $(".dx-texteditor").first().dxNumberBox("instance");
    assert.equal(editor.option("value"), 0.2, "editor's value");

    //act
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(0).trigger("dxclick");

    //assert
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
    editor = $(".dx-texteditor").first().dxTextBox("instance");
    assert.equal(editor.option("value"), "ShumShumShum Shum", "editor's value");
});

QUnit.test("Edit batch. Close edit mode for the form widget when a data is saved", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 102);
    this.editingController.saveEditData();
    $itemsContent = $(".dx-field-item-content");

    //assert
    assert.equal($(".dx-texteditor").length, 0, "editor's count");
    assert.equal($itemsContent.eq(1).text(), "102", "text is updated");
});

QUnit.test("Edit batch. Close edit mode and cancel editing when click out the data grid", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    this.clock.tick();
    editor.option("value", 102);
    $(document).trigger("dxclick");
    this.clock.tick();
    $itemsContent = $(".dx-field-item-content");

    //assert
    assert.equal($(".dx-texteditor").length, 0, "editor's count");
    assert.equal($itemsContent.eq(1).text(), "102", "text is updated");
});

QUnit.test("Edit batch. Close edit mode for the form widget when a editing is canceled", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 102);
    this.editingController.cancelEditData();
    $itemsContent = $(".dx-field-item-content");

    //assert
    assert.equal($(".dx-texteditor").length, 0, "editor's count");
    assert.equal($itemsContent.eq(1).text(), "0.2", "text of item");
});

QUnit.test("Edit batch. Form's item is marked as modified", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);
    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    this.clock.tick();
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 14);
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(0).trigger("dxclick");
    this.clock.tick();
    editor = $(".dx-texteditor").first().dxTextBox("instance");
    editor.option("value", "Test");
    $(document).trigger("dxclick");
    this.clock.tick();
    $itemsContent = $(".dx-field-item-content");

    //assert
    assert.ok($itemsContent.eq(0).hasClass("dx-item-modified"), "1 item. modified css class is added");
    assert.ok($itemsContent.eq(1).hasClass("dx-item-modified"), "2 item. modified css class is added");
});

QUnit.test("Edit batch. Form's item is marked as modified for other adaptive row", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    var editor,
        $itemsContent;

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(1).trigger("dxclick");
    this.clock.tick();
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 30);
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(0).trigger("dxclick");
    this.clock.tick();
    editor = $(".dx-texteditor").first().dxTextBox("instance");
    editor.option("value", "test");
    $(document.body).trigger("dxclick");
    this.clock.tick();
    this.adaptiveColumnsController.collapseAdaptiveDetailRow(dataSource[0]);
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    //assert
    $itemsContent = $(".dx-field-item-content");
    assert.ok($itemsContent.eq(0).hasClass("dx-item-modified"), "modified css class is added");
    assert.ok($itemsContent.eq(1).hasClass("dx-item-modified"), "modified css class is added");

    this.adaptiveColumnsController.collapseAdaptiveDetailRow(dataSource[0]);
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[1]);

    $itemsContent = $(".dx-field-item-content");

    //assert
    assert.ok(!$itemsContent.eq(0).hasClass("dx-item-modified"), "modified css class is not added");
    assert.ok(!$itemsContent.eq(1).hasClass("dx-item-modified"), "modified css class is not added");
});

QUnit.test("Edit batch. Modified is removed from form's item when data is saved", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);
    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 14);
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(0).trigger("dxclick");
    this.editingController.saveEditData();

    //assert
    assert.equal($(".dx-item-modified").length, 0, "modified css class is removed");
});

QUnit.test("Edit batch. Modified is removed from form's item when editing is canceled", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);
    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 14);
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(0).trigger("dxclick");
    $itemsContent = $(".dx-field-item-content");
    this.editingController.cancelEditData();

    //assert
    assert.equal($(".dx-item-modified").length, 0, "modified css class is removed");
});

QUnit.test("Edit batch. ShowEditorAlways option for form's item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);

    this.columns = [
        { dataField: 'firstName', index: 0, allowEditing: true },
        { dataField: 'lastName', index: 1, showEditorAlways: true, allowEditing: true }
    ];
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true,
            texts: {
                editRow: 'Edit'
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    $(".dx-field-item-content").first().trigger("dxclick");
    this.clock.tick();

    //assert
    var $editors = $(".dx-form .dx-texteditor"),
        editor = $editors.first().data("dxTextBox");

    assert.equal($editors.length, 1, "editors count");
    assert.ok(!editor.option("readOnly"), "editor has not readOnly mode");
});

QUnit.test("Edit batch. Show modified state in a cell when cell is edited inside the adaptive row", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content"),
        editor;

    $itemsContent.last().trigger("dxclick");
    this.clock.tick();

    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 102);
    $(document).trigger("dxclick");
    this.clock.tick();
    $(".dx-datagrid").width(1000);
    this.resizingController.resize();
    this.clock.tick();

    assert.equal($(".dx-cell-modified .dx-highlight-outline").text(), "102", "text of modified cell");
});

QUnit.test("Edit batch. Repaint form with unsaved data", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'batch',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content"),
        editor,
        formInstance;

    $itemsContent.last().trigger("dxclick");
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    editor.option("value", 102);

    formInstance = $(".dx-master-detail-row .dx-form").dxForm("instance");
    formInstance.repaint();
    editor = $(".dx-texteditor").first().dxNumberBox("instance");
    //assert
    assert.equal(editor.option("value"), 102, "editor's value is ok");
});

QUnit.test("Edit cell. Render editor of form's item when clicked on a text of item", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'cell',
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    $(".dx-field-item-content").first().trigger("dxclick");

    //assert
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
    assert.equal($(".dx-editor-cell").length, 0, "the editor cell class is not applied");
});

QUnit.test("Edit cell. Editor is rendered only one when click on text", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var dataSource = [
        { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum", count: 0.2 },
        { firstName: 'Super', lastName: "Man", count: 0.5 }
    ];

    this.options = {
        columns: [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true },
            { dataField: 'count', index: 2, allowEditing: true }
        ],
        editing: {
            mode: 'cell',
            allowUpdating: true
        },
        dataSource: {
            asyncLoadEnabled: false,
            store: dataSource
        },
        columnHidingEnabled: true
    };

    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

    var $itemsContent = $(".dx-field-item-content");

    //assert
    assert.equal($itemsContent.length, 2, "items count");

    //act
    $itemsContent.last().trigger("dxclick");

    //assert
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
    var editor = $(".dx-texteditor").first().dxNumberBox("instance");
    assert.equal(editor.option("value"), 0.2, "editor's value");

    //act
    editor.option("value", 300);
    $itemsContent = $(".dx-field-item-content");
    $itemsContent.eq(0).trigger("dxclick");
    $itemsContent = $(".dx-field-item-content");

    //assert
    assert.equal($itemsContent.last().text(), "300", "editor's value");
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
    editor = $(".dx-texteditor").first().dxTextBox("instance");
    assert.equal(editor.option("value"), "ShumShumShum Shum", "editor's value");
});

QUnit.test("Edit cell. Render editor for column with wrong visibleIndex", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.columns = [
        { dataField: 'firstName', index: 0, visibleIndex: 1, allowEditing: true },
        { dataField: 'lastName', index: 1, visibleIndex: 0, allowEditing: true }
    ];

    this.items = [
        { firstName: 'Blablablablablablablablablabla', lastName: "Psy" },
        { firstName: 'Super', lastName: "Star" }
    ];

    this.options = {
        editing: {
            mode: 'cell',
            allowUpdating: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);

    $(".dx-field-item-content").first().trigger("dxclick");

    //assert
    assert.equal($(".dx-texteditor").length, 1, "editor's count");
});

QUnit.test("Create new row in the batch mode", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();

    //assert
    assert.equal($(".dx-adaptive-detail-row .dx-texteditor").length, 0, "editor's count");
    var $itemsContent = $(".dx-adaptive-detail-row .dx-field-item-content");
    assert.equal($itemsContent.length, 1, "items count");
    assert.equal($itemsContent.eq(0).html(), "&nbsp;", "empty html markup");
    assert.ok(this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is expanded");
});

QUnit.test("Create new row is the batch mode. Save new values", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();
    var $itemsContent = $(".dx-adaptive-detail-row .dx-field-item-content"),
        editors;

    $itemsContent.first().trigger("dxclick");

    editors = $(".dx-adaptive-detail-row .dx-texteditor");
    editors.first().data("dxTextBox").option("value", "12test");
    this.editingController.saveEditData();

    //assert
    assert.ok(!this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is collapsed");
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[2]);
    assert.equal($(".dx-field-item-content").first().text(), "12test", "text of item");
});

QUnit.test("Create new row is the batch mode. Cancel new values", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();
    var $itemsContent = $(".dx-adaptive-detail-row .dx-field-item-content"),
        editors;

    $itemsContent.first().trigger("dxclick");

    editors = $(".dx-texteditor");
    editors.first().data("dxTextBox").option("value", "12test");
    this.editingController.cancelEditData();

    //assert
    assert.ok(!this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is collapsed");
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[2]);
    assert.equal($(".dx-field-item-content").first().text(), "", "empty html markup");
});

QUnit.test("Create new row in the cell mode", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'cell',
            allowUpdating: true,
            allowAdding: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();
    var $itemsContent = $(".dx-adaptive-detail-row .dx-field-item-content");

    //assert
    assert.equal($itemsContent.length, 1, "editor's count");
    assert.equal($itemsContent.first().html(), "&nbsp;", "");
    assert.ok(this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is expanded");
});

QUnit.test("Create new row is the cell mode. Save new values", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'cell',
            allowUpdating: true,
            allowAdding: true
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();
    this.clock.tick();

    var $itemsContent = $(".dx-adaptive-detail-row .dx-field-item-content"),
        editors;

    $itemsContent.first().trigger("dxclick");
    this.clock.tick();
    editors = $(".dx-texteditor");

    //assert
    assert.equal(editors.length, 1, "editor's count");

    //act
    editors.first().data("dxTextBox").option("value", "12test");
    $(document).trigger("dxclick");
    this.clock.tick();

    //assert
    assert.ok(!this.adaptiveColumnsController.hasAdaptiveDetailRowExpanded(), "row is collapsed");
    this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[2]);
    assert.equal($(".dx-field-item-content").first().text(), "12test", "text of item");
});

QUnit.test("Not collapse adaptive detail form when other row is deleted", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: true
        }
    };
    this.items = [];
    this.columns = [
        { dataField: 'firstName', index: 0, allowEditing: true, width: 100 },
        { dataField: 'lastName', index: 1, allowEditing: true, width: 100 },
        { dataField: 'Column 1', index: 2, allowEditing: true, width: 100 },
        { dataField: 'Column 2', index: 3, allowEditing: true, width: 100 },
        { dataField: 'Column 3', index: 4, allowEditing: true, width: 100 }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();
    this.editingController.addRow();
    this.editingController.addRow();
    this.editingController.deleteRow(2);

    //assert
    assert.equal($(".dx-adaptive-detail-row").length, 1, "adaptive detail form should be removed");
});

QUnit.test("Collapse adaptive detail form when single row is deleted", function(assert) {
    //arrange
    $(".dx-datagrid").width(200);
    this.options = {
        editing: {
            mode: 'batch',
            allowUpdating: true,
            allowAdding: true
        }
    };
    this.items = [];
    this.columns = [
        { dataField: 'firstName', index: 0, allowEditing: true, width: 100 },
        { dataField: 'lastName', index: 1, allowEditing: true, width: 100 },
        { dataField: 'Column 1', index: 2, allowEditing: true, width: 100 },
        { dataField: 'Column 2', index: 3, allowEditing: true, width: 100 },
        { dataField: 'Column 3', index: 4, allowEditing: true, width: 100 }
    ];
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
    this.resizingController.updateDimensions();
    this.clock.tick();

    //act
    this.editingController.addRow();
    this.editingController.deleteRow(0);

    //assert
    assert.equal($(".dx-adaptive-detail-row").length, 0, "adaptive detail form should be removed");
});

//T565727
QUnit.test("Edit row. Re-render adaptive detail after re-inserting row", function(assert) {
    //arrange
    $(".dx-datagrid").width(400);

    var args = [];

    this.options = {
        editing: {
            mode: 'row',
            allowUpdating: true,
            allowAdding: true
        },
        onRowPrepared: function(e) {
            if(e.inserted) {
                args.push(e);
            }
        }
    };
    setupDataGrid(this);
    this.rowsView.render($("#container"));
    this.resizingController.updateDimensions();

    this.editingController.addRow();

    //assert
    assert.strictEqual(args.length, 2, "onRowPrepared call count");
    assert.strictEqual(args[0].rowType, "data", "data row");
    assert.strictEqual(args[1].rowType, "detailAdaptive", "adaptive detail row");

    //act
    this.editingController.addRow();

    assert.strictEqual(args.length, 4, "onRowPrepared call count");
    assert.strictEqual(args[2].rowType, "data", "data row");
    assert.strictEqual(args[3].rowType, "detailAdaptive", "adaptive detail row");
});

QUnit.module("Validation", {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
    }
}, function() {
    QUnit.testInActiveWindow("Row edit mode", function(assert) {
        //arrange
        $(".dx-datagrid").width(200);

        var dataSource = [
            { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum" },
            { firstName: 'Super', lastName: "Man" }
        ];

        this.options = {
            columns: [
                { dataField: 'firstName', index: 0, allowEditing: true },
                { dataField: 'lastName', index: 1, allowEditing: true, validationRules: [{ type: "required" }] }
            ],
            editing: {
                mode: 'row',
                allowUpdating: true
            },
            dataSource: {
                asyncLoadEnabled: false,
                store: dataSource
            },
            columnHidingEnabled: true
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));
        this.resizingController.updateDimensions();
        this.clock.tick();

        //act
        this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);
        this.editingController.editRow(0);
        this.clock.tick();

        $(".dx-form .dx-texteditor input").first().focus();

        var editor = $(".dx-form .dx-texteditor").first().dxTextBox("instance");
        editor.option("value", "");
        this.clock.tick(10);

        //assert
        assert.ok($(".dx-field-item-content > .dx-widget.dx-validator").length === 1, "item element has a validation styles");
        assert.equal($(".dx-invalid-message.dx-widget").length, 1, "Validation message is shown");
    });

    QUnit.testInActiveWindow("The adaptive detail row is not collapsed when data is invalid for the row edit mode", function(assert) {
        //arrange
        $(".dx-datagrid").width(200);

        var dataSource = [
            { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum" },
            { firstName: 'Super', lastName: "Man" }
        ];

        this.options = {
            columns: [
                { dataField: 'firstName', index: 0, allowEditing: true },
                { dataField: 'lastName', index: 1, allowEditing: true, validationRules: [{ type: "required" }] }
            ],
            editing: {
                mode: 'row',
                allowUpdating: true
            },
            dataSource: {
                asyncLoadEnabled: false,
                store: dataSource
            },
            columnHidingEnabled: true
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));
        this.resizingController.updateDimensions();
        this.clock.tick();

        //act
        this.editingController.editRow(0);
        this.clock.tick();

        $(".dx-form .dx-texteditor input").first().focus();

        var editor = $(".dx-form .dx-texteditor").first().dxTextBox("instance");
        editor.option("value", "");
        this.clock.tick(10);

        this.editingController.saveEditData();
        this.clock.tick();

        assert.ok(this.adaptiveColumnsController.isAdaptiveDetailRowExpanded(dataSource[0]), "the adaptive row is expanded");
    });

    QUnit.testInActiveWindow("Batch edit mode", function(assert) {
        //arrange
        $(".dx-datagrid").width(200);

        var dataSource = [
            { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum" },
            { firstName: 'Super', lastName: "Man" }
        ];

        this.options = {
            columns: [
                { dataField: 'firstName', index: 0, allowEditing: true },
                { dataField: 'lastName', index: 1, allowEditing: true, validationRules: [{ type: "required" }] }
            ],
            editing: {
                mode: 'batch',
                allowUpdating: true
            },
            dataSource: {
                asyncLoadEnabled: false,
                store: dataSource
            },
            columnHidingEnabled: true
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));
        this.resizingController.updateDimensions();
        this.clock.tick();

        //act
        this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

        var $itemsContent = $(".dx-field-item-content"),
            editor;

        $itemsContent.first().trigger("dxclick");
        this.clock.tick();

        editor = $(".dx-form .dx-texteditor").first().dxTextBox("instance");
        editor.option("value", "");
        $(document).trigger("dxclick");
        this.clock.tick();

        //assert
        assert.ok($(".dx-field-item-content.dx-validator").length === 1, "item element has a validation styles");
        assert.ok($(".dx-field-item-content.dx-datagrid-invalid").length === 1, "item element has a invalid css class");

        //act
        $itemsContent = $(".dx-field-item-content");
        $itemsContent.first().trigger("dxclick");
        this.clock.tick();

        //assert
        assert.ok($(".dx-field-item-content > .dx-widget.dx-validator").length === 1, "editor into a form item has a validation styles");
        assert.equal($(".dx-invalid-message.dx-widget").length, 1, "Validation message is shown");
    });

    QUnit.testInActiveWindow("Batch edit mode. Editor is not marked as invalid when row is created", function(assert) {
        //arrange
        $(".dx-datagrid").width(200);

        this.columns = [
            {
                dataField: 'firstName',
                index: 0,
                allowEditing: true
            },
            {
                dataField: 'lastName',
                index: 1,
                allowEditing: true,
                validationRules: [{ type: "required" }]
            }
        ];
        this.options = {
            editing: {
                mode: 'batch',
                allowUpdating: true,
                allowAdding: true,
                texts: {
                    editRow: 'Edit'
                }
            }
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));
        this.resizingController.updateDimensions();
        this.clock.tick();

        //act
        this.editingController.addRow();
        var $itemsContent = $(".dx-field-item-content");

        $itemsContent.first().trigger("dxclick");
        this.clock.tick();

        //assert
        assert.equal($(".dx-invalid-message.dx-widget").length, 0, "Validation message is not shown");
    });

    QUnit.testInActiveWindow("Cell edit mode", function(assert) {
        //arrange
        $(".dx-datagrid").width(200);

        var dataSource = [
            { firstName: 'Blablablablablablablablablabla', lastName: "ShumShumShum Shum" },
            { firstName: 'Super', lastName: "Man" }
        ];

        this.options = {
            columns: [
                { dataField: 'firstName', index: 0, allowEditing: true },
                { dataField: 'lastName', index: 1, allowEditing: true, validationRules: [{ type: "required" }] }
            ],
            editing: {
                mode: 'cell',
                allowUpdating: true
            },
            dataSource: {
                asyncLoadEnabled: false,
                store: dataSource
            },
            columnHidingEnabled: true
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));
        this.resizingController.updateDimensions();
        this.clock.tick();
        var showRevertButtonStub = sinon.stub(this.editorFactoryController, "_showRevertButton");

        //act
        this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

        var $itemsContent = $(".dx-field-item-content"),
            editor;

        $itemsContent.first().trigger("dxclick");
        this.clock.tick();

        editor = $(".dx-form .dx-texteditor").first().dxTextBox("instance");
        editor.option("value", "");
        $(document).trigger("dxclick");
        this.clock.tick();

        //assert
        assert.ok($(".dx-field-item-content > .dx-widget.dx-validator").length === 1, "item element has a validation styles");
        assert.equal($(".dx-invalid-message.dx-widget").length, 1, "Validation message is shown");
        assert.ok(showRevertButtonStub.called, "revert button");
    });

    QUnit.testInActiveWindow("Tooltips selector for the revert button", function(assert) {
        setupDataGrid(this);
        var expected = ".dx-editor-cell .dx-tooltip, .dx-editor-cell .dx-invalid-message, .dx-field-item-content .dx-tooltip";
        assert.equal(this.editorFactoryController._getTooltipsSelector(), expected, "tooltips selector");
    });

    QUnit.testInActiveWindow("Cell edit mode. Validation works only for editable form item with a validation rules", function(assert) {
        //arrange
        $(".dx-datagrid").width(200);

        var dataSource = [
            { firstName: 'Super', lastName: "Man", description: "Test Test Test" },
            {
                firstName: 'Blablablablablablablablablabla',
                lastName: "ShumShumShum Shum",
                description: "Test Test Test"
            }
        ];

        this.options = {
            columns: [
                {
                    dataField: 'firstName',
                    index: 0,
                    allowEditing: true
                },
                {
                    dataField: 'lastName',
                    index: 1, allowEditing: true,
                    validationRules: [{ type: "required" }]
                },
                {
                    dataField: "description",
                    index: 2,
                    allowEditing: true
                }
            ],
            editing: {
                mode: 'cell',
                allowUpdating: true
            },
            dataSource: {
                asyncLoadEnabled: false,
                store: dataSource
            },
            columnHidingEnabled: true
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));
        this.resizingController.updateDimensions();
        this.clock.tick();

        //act
        this.adaptiveColumnsController.expandAdaptiveDetailRow(dataSource[0]);

        var $itemsContent = $(".dx-field-item-content"),
            editor;

        $itemsContent.eq(1).trigger("dxclick");
        this.clock.tick();

        editor = $(".dx-form .dx-texteditor").first().dxTextBox("instance");
        editor.option("value", "");
        $(document).trigger("dxclick");
        this.clock.tick();

        $itemsContent = $(".dx-field-item-content");

        //assert
        assert.ok(!$itemsContent.first().hasClass("dx-datagrid-invalid"), "invalid style should not be applied");
    });

    QUnit.test("The onRowValidating event is not called twice if isValid is set to 'false'", function(assert) {
        //arrange
        $(".dx-datagrid").width(800);

        var rowValidatingCounter = 0;

        this.options = {
            columns: [
                { dataField: 'firstName', index: 0, allowEditing: true },
                { dataField: 'lastName', index: 1, allowEditing: true, validationRules: [{ type: "required" }] }
            ],
            editing: {
                mode: 'batch',
                allowUpdating: true
            },
            dataSource: {
                asyncLoadEnabled: false,
                store: [{
                    firstName: 'Test First Name',
                    lastName: "Test Last Name"
                }]
            },
            onRowValidating: function(e) {
                rowValidatingCounter++;
                e.isValid = false;
            }
        };
        setupDataGrid(this);
        this.rowsView.render($("#container"));

        //act
        this.editingController.editCell(0, 0);

        $("input")
            .val("new value")
            .change();

        this.editingController.saveEditData();

        //assert
        assert.equal(rowValidatingCounter, 1, "onRowValidating event should thrown once");
    });
});

QUnit.module("Keyboard navigation", {
    setupModule: function() {
        this.$dataGrid = $(".dx-datagrid").width(200);

        this.columns = this.columns || [
            { dataField: 'firstName', index: 0, allowEditing: true, allowExporting: true },
            { dataField: 'lastName', index: 1, allowEditing: true, allowExporting: true },
            { dataField: 'fullName', index: 1, allowEditing: true, allowExporting: true }
        ];

        this.items = this.items || [
            { firstName: 'Blablablablablablablablablabla', lastName: "Psy", fullName: "Full Name" },
            { firstName: 'Super', lastName: "Star", fullName: "Full Name" }
        ];

        this.options = $.extend({
            useKeyboard: true,
            tabIndex: 0,
            editing: {
                mode: 'batch',
                allowUpdating: true
            }
        }, this.options);
        setupDataGrid(this, $("#container"));

        this.gridView.render($("#container"));
        this.adaptiveColumnsController.updateHidingQueue(this.columnsController.getColumns());
        this.resizingController.updateDimensions();
        this.clock.tick();

        this.adaptiveColumnsController.expandAdaptiveDetailRow(this.items[0]);
    },

    getActiveInputElement: function() {
        return this.$dataGrid.find("input");
    },

    triggerFormItemClick: function(index) {
        $(".dx-field-item-content").eq(index).trigger("dxclick");
        this.clock.tick();
    },

    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },

    afterEach: function() {
        this.clock.restore();
    }
}, function() {
    QUnit.testInActiveWindow("Edit next an adaptive detail item by tab key", function(assert) {
        //arrange
        this.setupModule();
        this.triggerFormItemClick(0);

        //assert
        var $nextItemContent = this.getActiveInputElement().closest(".dx-item").next().find(".dx-field-item-content");
        assert.equal($nextItemContent.text(), "Full Name", "next item text");
        assert.equal($nextItemContent.attr("tabindex"), 0, "next item has tabindex");

        //act
        $nextItemContent.triggerHandler("focus");
        this.clock.tick();

        //assert
        var $input = this.getActiveInputElement();
        assert.equal($input.val(), "Full Name", "current input is correct");
    });

    QUnit.testInActiveWindow("Edit previous an adaptive detail item by shift + tab key", function(assert) {
        //arrange
        this.setupModule();
        this.triggerFormItemClick(1);

        //assert
        var $nextItemContent = this.getActiveInputElement().closest(".dx-item").prev().find(".dx-field-item-content");
        assert.equal($nextItemContent.text(), "Psy", "next item text");
        assert.equal($nextItemContent.attr("tabindex"), 0, "next item has tabindex");

        //act
        $nextItemContent.triggerHandler("focus");
        this.clock.tick();

        //assert
        var $input = this.getActiveInputElement();
        assert.equal($input.val(), "Psy", "current input is correct");
    });

    QUnit.testInActiveWindow("Editable cell is closed when focus moving outside detail form", function(assert) {
        //arrange
        this.setupModule();
        this.triggerFormItemClick(1);

        //act
        var e = $.Event('keydown');
        e.which = 9;
        this.getActiveInputElement().trigger(e);
        this.clock.tick();

        var $cell = this.$dataGrid.find("td:not([class])").eq(1);
        $cell.triggerHandler("focus");
        this.clock.tick();

        var $input = this.getActiveInputElement();
        assert.equal($input.val(), "Super", "current input is correct");
    });

    QUnit.testInActiveWindow("Skip hidden column when use a keyboard navigation via 'tab' key", function(assert) {
        //arrange
        this.columns = [
            { dataField: 'firstName', index: 0, allowEditing: true },
            { dataField: 'lastName', index: 1, allowEditing: true, hidingPriority: 1 },
            { dataField: 'fullName', index: 1, allowEditing: true }
        ];

        this.setupModule();

        $(".dx-datagrid").width(500);
        this.resizingController.updateDimensions();
        this.clock.tick();

        this.editingController.editCell(0, 0);
        this.clock.tick();

        //act
        var e = $.Event('keydown');
        e.which = 9;
        this.getActiveInputElement().trigger(e);

        //assert
        assert.equal(this.getActiveInputElement().val(), "Full Name");
    });

    QUnit.testInActiveWindow("Error is not thrown when via keyboard navigation to adaptive form for new row", function(assert) {
        //arrange
        this.items = [];
        this.columns = [
            { dataField: 'firstName', index: 0, allowEditing: true, width: 200 },
            { dataField: 'lastName', index: 1, allowEditing: true, width: 200 },
            { dataField: 'fullName', index: 1, allowEditing: true, width: 200 }
        ];
        this.options = {
            editing: {
                allowAdding: true,
                mode: "row"
            }
        };
        this.setupModule();
        this.editingController.addRow();
        this.clock.tick();

        //act
        var e = $.Event('keydown');
        e.which = 9;
        this.getActiveInputElement().trigger(e);

        //assert
        assert.deepEqual(this.keyboardNavigationController._focusedCellPosition, { columnIndex: 0, rowIndex: 0 });
    });

    if(device.deviceType === "desktop") {
        QUnit.testInActiveWindow("Skip editing via 'shift + tab' key before entry to adaptive detail form", function(assert) {
            //arrange
            this.setupModule();
            this.editingController.editCell(2, 0);
            this.clock.tick();

            //act
            var e = $.Event('keydown');
            e.which = 9;
            e.shiftKey = true;
            this.getActiveInputElement().trigger(e);

            //assert
            assert.equal(this.getActiveInputElement().val(), "Super");
        });

        QUnit.testInActiveWindow("Skip editing via 'tab' key before entry to adaptive detail form", function(assert) {
            //arrange
            this.setupModule();
            this.editingController.editCell(0, 0);
            this.clock.tick();

            //act
            var e = $.Event('keydown');
            e.which = 9;
            this.getActiveInputElement().trigger(e);

            //assert
            assert.equal(this.getActiveInputElement().val(), "Blablablablablablablablablabla");
        });
    }
});
