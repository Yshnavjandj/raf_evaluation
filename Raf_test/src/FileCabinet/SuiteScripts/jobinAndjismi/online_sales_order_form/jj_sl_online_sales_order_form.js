/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/search','N/record'],
    /**
 * @param{serverWidget} serverWidget
 */
    (serverWidget,search,record) => {

        const salesOrderForm = (scriptContext) => {

            try {

                if(scriptContext.request.method === 'GET') {

                    let form = serverWidget.createForm({
                        title: 'Online Sales Order Form'
                    });
    
                    form.addField({
                        id: 'custpage_first_name',
                        label: 'First Name',
                        type: serverWidget.FieldType.TEXT
                    });
    
                    form.addField({
                        id: 'custpage_last_name',
                        label: 'Last Name',
                        type: serverWidget.FieldType.TEXT
                    });
    
                    form.addField({
                        id: 'custpage_email',
                        label: 'Email',
                        type: serverWidget.FieldType.EMAIL
                    });
                    
                    form.addField({
                        id: 'custpage_phone',
                        label: 'Phone',
                        type: serverWidget.FieldType.PHONE
                    });
    
                    let sublist = form.addSublist({
                        id : 'item',
                        type : serverWidget.SublistType.INLINEEDITOR,
                        label : 'Items'
                    });

                    sublist.addField({
                        id: 'custpage_item_field',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Item',
                        source: 'item'
                    });

                    sublist.addField({
                        id: 'custpage_description',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Description'
                    });

                    sublist.addField({
                        id: 'custpage_quantity',
                        type: serverWidget.FieldType.INTEGER,
                        label: 'Quantity'
                    });

                    sublist.addField({
                        id: 'custpage_price',
                        type: serverWidget.FieldType.FLOAT,
                        label: 'Price'
                    });

                    sublist.addField({
                        id: 'custpage_amount',
                        type: serverWidget.FieldType.FLOAT,
                        label: 'Amount'
                    });

                    form.clientScriptModulePath = './jj_cs_sales_order_form.js';

                    form.addSubmitButton({
                        label : 'Submit'
                    });

                    scriptContext.response.writePage(form);

                }else {

                    let email = scriptContext.request.parameters.custpage_email;
                    let fName = scriptContext.request.parameters.custpage_first_name;
                    let lName = scriptContext.request.parameters.custpage_last_name;
                    let phone = scriptContext.request.parameters.custpage_phone;

                    let amount = scriptContext.request.getSublistValue({
                        group: 'item',
                        name: 'custpage_amount',
                        line: 0
                    });

                    let item = scriptContext.request.getSublistValue({
                        group: 'item',
                        name: 'custpage_item_field',
                        line: 0
                    });

                    let quantity = scriptContext.request.getSublistValue({
                        group: 'item',
                        name: 'custpage_quantity',
                        line: 0
                    });

                    let description = scriptContext.request.getSublistValue({
                        group: 'item',
                        name: 'custpage_description',
                        line: 0
                    });

                    let itemRecord = search.lookupFields({
                        type: search.Type.ITEM,
                        id: item,
                        columns: ['itemid','internalid']
                    });

                    // log.debug("amount: ",amount);
                    log.debug("item: ",item);
                    log.debug("item record search: ",itemRecord);
                    // log.debug("descr: ",description);
                    // log.debug(": ",amount);

                    let customerSearch = search.create({
                        type: search.Type.CUSTOMER,
                        filters: [{
                            name: 'email',
                            operator: 'is',
                            values: email
                        }],
                        columns: ['internalid','entityid','email','subsidiary']
                    });

                    let searchResult = customerSearch.run().getRange({
                        start: 0,
                        end: 1
                    });

                    if(searchResult.length > 0) {

                        let customerId = searchResult[0].id;

                        log.debug("cus: ",customerId);
                        log.debug("search: ",searchResult);

                        let salesOrder = record.create({
                            type: record.Type.SALES_ORDER,
                            defaultValues: {
                                entity: customerId
                            }
                        });

                        // salesOrder.insertLine({
                        //     sublistId: 'item',
                        //     line: 0
                        // });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: 0,
                            value: item
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: 0,
                            value: quantity
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: 0,
                            value: description
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: 0,
                            value: amount
                        });

                        let so = salesOrder.save();

                        log.debug("sales order: ",so);


                        // ##################### Need to get the line count to add exact line items from the suitelet page into new sales order #############################

                        //################# after retreiving the line count need to create a salesorder with the already existing customer ###################################################

                    }else {

                        let customer = record.create({
                            type: record.Type.CUSTOMER
                        });

                        customer.setValue({
                            fieldId: 'isperson',
                            value: true
                        });

                        customer.setValue({
                            fieldId: 'firstname',
                            value: fName
                        });

                        customer.setValue({
                            fieldId: 'lastname',
                            value: lName
                        });

                        customer.setValue({
                            fieldId: 'email',
                            value: email
                        });

                        customer.setValue({
                            fieldId: 'phone',
                            value: phone
                        });

                        customer.setValue({
                            fieldId: 'subsidiary',
                            value: 11
                        });

                        let newCustomer = customer.save();

                        log.debug("new customer: ",newCustomer);

                        let salesOrder = record.create({
                            type: record.Type.SALES_ORDER,
                            defaultValues: {
                                entity: newCustomer
                            }
                        });

                        salesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: 0,
                            value: item
                        });

                        //############################ Creating a new customer and after that create a new sales order with that customer ################################

                        //############## after calculating total item amount check whether it exeeds 500 usd inside if condition, if so then, send an email using email module. #################
                    }
                   
                }

            } catch (error) {
                log.debug("error: ",error);
                log.debug("error: ",error.message);
                log.debug("error: ",error.cause);
            }
        }

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                salesOrderForm(scriptContext);
            } catch (error) {
                log.debug("error: ",error);
                log.debug("error: ",error.message);
                log.debug("error: ",error.cause);
            }
        }

        return {onRequest}

    });
