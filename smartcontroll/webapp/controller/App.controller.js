sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/BindingMode",
    "sap/m/Input",
    "sap/m/ColumnListItem",
    "sap/ui/core/Icon",
    "sap/ui/model/json/JSONModel",
    "sap/m/ComboBox",
    "sap/ui/core/Item",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    Controller,
    MessageToast,
    BindingMode,
    Input,
    ColumnListItem,
    Icon,
    JSONModel,
    ComboBox,
    Item
  ) {
    "use strict";

    return Controller.extend("smartcontroll.controller.App", {
      onInit: function () {
        var oViewModel = new JSONModel({
          editable: false,
        });
        this.getView().setModel(oViewModel, "appView");
      },

      /**
       * @override
       */
      onBeforeRendering: function () {
        this.getView()
          .byId("idSmartTable")
          .getModel()
          .setDefaultBindingMode(BindingMode.TwoWay);
      },

      onToggleSave: function (oEvent) {
        var oSwitch = oEvent.getSource();
        var bEditMode = oSwitch.getState();
        var oSmartTable = this.getView().byId("idSmartTable");

        var oTable = oSmartTable.getTable();
        oSmartTable.setEditable(bEditMode);
        var oToolbar = this.byId("idToolbarCrud");
        oToolbar.setVisible(bEditMode);
        var oSendButton = this.byId("idSendButton");
        oSendButton.setVisible(bEditMode);
        var oStatus = this.byId("idStatusColumn");
        oStatus.setVisible(bEditMode);
        if (bEditMode) {
          this.getView().getModel("appView").setProperty("/editable", true);
        } else {
          this.getView().getModel("appView").setProperty("/editable", false);
        }
      },
      deleteItemsList: [],
      onDelete: function (oEvent) {
        var oModel = this.getView().byId("idSmartTable").getModel();
        oModel.setUseBatch(false);

        var oTable = this.getView().byId("idTable");
        var aSelectedItems = oTable.getSelectedItems();
        if (aSelectedItems.length === 0) {
          MessageToast.show("please select at least one row");
          return;
        }
        if (aSelectedItems.length > 0) {
          this.deleteItemsList = aSelectedItems.map(function (oSelectedItem) {
            oSelectedItem.getCells()[0].setSrc("sap-icon://delete");
            oSelectedItem.getCells()[0].setColor("red");
            let oSelectedID = oSelectedItem
              .getBindingContext()
              .getProperty("ProductID");
            return oSelectedID;
          });
          oTable.removeSelections();
          this.onGenericChange();
        } else {
          MessageToast.show("No items selected for deletion.");
        }
      },
      onEdit: function (oEvent) {},
      onReset: function () {
        var oTable = this.getView().byId("idTable");
        var oTableModel = oTable.getModel();
        var aItems = oTable.getItems();

        aItems.forEach(function (item) {
          item.getCells()[0].setSrc();
        });

        oTable.removeSelections();
        this.onGenericDefault();

        if (this.addItemsList && this.addItemsList.length > 0) {
          this.addItemsList.forEach(function (item) {
            oTable.removeItem(item);
          });
          this.addItemsList = [];
        }

        this.deleteItemsList = [];

        oTableModel.resetChanges();
      },
      onSend: function () {
        if (this.addItemsList && this.addItemsList.length > 0) {
          for (let i = 0; i < this.addItemsList.length; i++) {
            var aNew = this.addItemsList[i].getCells();
            let newItem = {
              ProductID: aNew[1]._lastValue,
              TypeCode: aNew[2]._lastValue,
              SupplierID: aNew[3].getSelectedKey(),
              CurrencyCode: aNew[4]._lastValue,
              Name: aNew[5]._lastValue,
              Category: aNew[6]._lastValue,
              Price: aNew[7]._lastValue,
              TaxTarifCode: Number(aNew[8]._lastValue),
              MeasureUnit: aNew[9]._lastValue,
            };
            var oModelAdd = this.getView().byId("idSmartTable").getModel();
            oModelAdd.setUseBatch(false);
            oModelAdd.create("/ProductSet", newItem, {
              success: function (oData, oResponse) {
                MessageToast.show("Create new product success");
              },
              error: function (oError) {
                MessageToast.show(
                  "Error creating new product: " + oError.message
                );
              },
            });
          }
        }

        var oModel = this.getView().byId("idSmartTable").getModel();
        oModel.setUseBatch(false);
        oModel.submitChanges();

        if (this.deleteItemsList && this.deleteItemsList.length > 0) {
          this.deleteItemsList.forEach(function (productID) {
            var sPath = "/ProductSet('" + productID + "')";
            oModel.remove(sPath, {
              success: function () {
                MessageToast.show("Deleted product with ID: " + productID);
              },
              error: function (e) {
                MessageToast.show(
                  "Error deleting product with ID: " + e.message
                );
              },
            });
          });
        }

        this.onReset();
      },
      addItemsList: [],
      onAdd: function () {
        this.onGenericChange();
        let oNew = new ColumnListItem({
          cells: [
            new Icon({ src: "sap-icon://add-document", color: "green" }),
            new Input({ value: "", liveChange: "onLiveChange", position: 1 }),
            new Input({ value: "PR", liveChange: "onLiveChange", position: 2 }),
            new ComboBox({
              selectionChange: "onComboBoxChange",
              items: {
                path: "/BusinessPartnerSet",
                enabled: "{comboBox>/editable}",
                template: new Item({
                  key: "{BusinessPartnerID}",
                  text: "{CompanyName}",
                }),
              },
            }),
            new Input({ value: "", liveChange: "onLiveChange", position: 4 }),
            new Input({ value: "", liveChange: "onLiveChange", position: 5 }),
            new Input({ value: "", liveChange: "onLiveChange", position: 6 }),
            new Input({ value: "", liveChange: "onLiveChange", position: 7 }),
            new Input({ value: "1", liveChange: "onLiveChange", position: 8 }),
            new Input({ value: "EA", liveChange: "onLiveChange", position: 9 }),
          ],
        });
        var oTable = this.getView().byId("idTable");
        oTable.insertItem(oNew, 0);
        this.addItemsList.push(oNew);
      },

      onLiveChange: function (oEvent) {
        this.addItemsList[this.addItemsList.length - 1].getCells()[
          oEvent.getParameter(position)
        ]._lastValue = oEvent.getParameter(value);
      },

      onComboBoxChange: function (oEvent) {
        this.onGenericChange();

        var numberId = oEvent.getParameter("id").match(/-([0-9]+)$/);
        var changedRowId = Number(numberId[numberId.length - 1]);

        if (this.addItemsList && this.addItemsList.length > 0) {
          changedRowId += this.addItemsList.length;
        }

        var oTable = this.getView().byId("idTable");
        oTable.getItems()[changedRowId].getCells()[0].setSrc("sap-icon://edit");
        oTable.getItems()[changedRowId].getCells()[0].setColor("blue");

        var supplierIdAfterChanged = oEvent
          .getParameter("selectedItem")
          .getProperty("key");
      },

      onGenericChange: function () {
        var oGenericTag = this.getView().byId("idGenericTag");
        oGenericTag.setText("Updated");
        oGenericTag.setStatus("Warning");
      },
      onGenericDefault: function () {
        var oGenericTag = this.getView().byId("idGenericTag");
        oGenericTag.setText("Not updated");
        oGenericTag.setStatus("Success");
      },
      onFieldChange: function (oEvent) {
        this.onGenericChange();
        //
        var numberId = oEvent
          .getParameters()
          .changeEvent.getParameters()
          .id.match(/-([0-9]+)$/);
        var changedRowId = numberId[numberId.length - 1];
        //
        var numberaddItemsList = this.addItemsList.length;
        changedRowId = parseInt(changedRowId, 10);
        changedRowId += numberaddItemsList;
        var oTable = this.getView().byId("idTable");
        oTable.getItems()[changedRowId].getCells()[0].setSrc("sap-icon://edit");
        oTable.getItems()[changedRowId].getCells()[0].setColor("blue");
      },
    });
  }
);
