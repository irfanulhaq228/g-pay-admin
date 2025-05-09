import axios from "axios";
import Cookies from "js-cookie";
import React, { useState, useEffect } from "react";
import { Button, Modal, Input, Form, notification, Popconfirm, Select, Row, Col } from "antd";

import BACKEND_URL, { fn_createPortal, fn_deletePortal, fn_getAllPortals } from "../../api/api";
import { fn_createCurrencyExchange, fn_getAllCurrencyExchange, fn_deleteCurrencyExchange, fn_editCurrencyExchange, fn_createLocation, fn_getAllLocations, fn_deleteLocation } from "../../api/api";

import { FiEdit } from "react-icons/fi";
import { FaExclamationCircle, FaTrash } from "react-icons/fa";

const CurrencyExchange = ({ authorization, showSidebar }) => {

  const [form] = Form.useForm();
  const [portalForm] = Form.useForm();
  const [locationForm] = Form.useForm();
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const containerHeight = window.innerHeight - 120;
  const [editModal, setIsEditModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalModal, setIsPortalModal] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    window.scroll(0, 0);
    if (!authorization) {
      navigate("/login");
    }
    fetchCurrencies();
    fetchLocations();
    fetchExchanges();
    fetchPortal();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fn_getAllCurrencyExchange();
      if (response.status) {
        setCurrencies(response.data);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch currencies",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch currencies",
      });
    }
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const response = await fn_getAllLocations();
      if (response.status) {
        setLocations(response.data);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch locations",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch locations",
      });
    }
  };

  const fetchPortal = async () => {
    try {
      const response = await fn_getAllPortals();
      if (response.status) {
        setPortals(response.data);
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to fetch portal name",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch portal name",
      });
    }
  };

  const fetchExchanges = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/exchange/get`);
      if (response?.status === 200) {
        setExchanges(
          response?.data?.data?.map((item) => ({
            value: item?._id,
            label: item?.currency,
            rate: item?.currencyRate,
            charges: item?.charges,
          }))
        );
      }
    } catch (error) {
      console.log("error while fetching exchange ", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch exchanges",
      });
    }
  };

  const handleAddCurrency = () => {
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setIsEditModal(false);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await fn_createCurrencyExchange({
        currency: values.currency,
        currencyRate: values.currencyRate,
        charges: values.charges,
        adminId: Cookies.get("adminId"),
      });

      if (response.status) {
        fetchCurrencies();
        notification.success({
          message: "Success",
          description: response.message || "Currency added successfully",
        });
        setIsModalOpen(false);
        form.resetFields();
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to add currency",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Please fill all required fields",
      });
    }
  };

  const handleDelete = async (currencyId) => {
    try {
      const response = await fn_deleteCurrencyExchange(currencyId);
      if (response.status) {
        notification.success({
          message: "Success",
          description: response.message,
        });
        fetchCurrencies(); // Refresh the list after deletion
      } else {
        notification.error({
          message: "Error",
          description: response.message,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete currency",
      });
    }
  };

  const fn_editCall = async (item) => {
    setIsEditModal(true);
    setSelectedCurrency(item);
    form.setFieldValue("currency", item?.currency);
    form.setFieldValue("currencyRate", item?.currencyRate);
    form.setFieldValue("charges", item?.charges);
  };

  const handleModalEdit = async () => {
    try {
      const values = await form.validateFields();
      const response = await fn_editCurrencyExchange(selectedCurrency?._id, {
        currency: values.currency,
        currencyRate: values.currencyRate,
        charges: values.charges,
        adminId: Cookies.get("adminId"),
      });

      if (response.status) {
        fetchCurrencies();
        notification.success({
          message: "Success",
          description: response.message || "Currency Updated successfully",
        });
        setIsModalOpen(false);
        setIsEditModal(false);
        form.resetFields();
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to update currency",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Please fill all required fields",
      });
    }
  };

  const handleAddLocation = () => {
    setIsLocationModalOpen(true);
  };

  const handleLocationModalCancel = () => {
    setIsLocationModalOpen(false);
    locationForm.resetFields();
  };

  const handlePortalModalCancel = () => {
    setIsPortalModal(false);
  };

  const handleLocationModalOk = async () => {
    try {
      const values = await locationForm.validateFields();
      const response = await fn_createLocation({
        location: values.location,
        exchangeId: values.exchangeId,
        adminId: Cookies.get("adminId"),
      });

      if (response.status) {
        notification.success({
          message: "Success",
          description: response.message || "Location added successfully",
        });
        locationForm.resetFields();
        fetchLocations();
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to add location",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Please fill all required fields",
      });
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      const response = await fn_deleteLocation(locationId);
      if (response.status) {
        notification.success({
          message: "Success",
          description: response.message,
        });
        fetchLocations(); // Refresh the locations list
      } else {
        notification.error({
          message: "Error",
          description: response.message,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete location",
      });
    }
  };

  const handleDeletePortal = async (portalId) => {
    try {
      const response = await fn_deletePortal(portalId);
      if (response.status) {
        notification.success({
          message: "Success",
          description: response.message,
        });
        fetchPortal();
      } else {
        notification.error({
          message: "Error",
          description: response.message,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete location",
      });
    }
  };

  const handlePortalModalOk = async () => {
    try {
      const values = await portalForm.validateFields();
      const response = await fn_createPortal(values);

      if (response.status) {
        notification.success({
          message: "Success",
          description: response.message || "Portal Name added successfully",
        });
        fetchPortal();
        portalForm.resetFields();
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to add Portal Name",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Please fill all required fields",
      });
    }
  };

  return (
    <>
      <div
        className={`bg-gray-100 transition-all duration-500 ${showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
          }`}
        style={{ minHeight: `${containerHeight}px` }}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-[12px] items-center justify-between mb-7">
            <h1 className="text-[25px] font-[500]">Currency Exchange</h1>
            <p className="text-[#7987A1] text-[13px] md:text-[15px] font-[400]">
              Dashboard - Currency Exchange
            </p>
          </div>

          {/* Add Currency button outside table */}
          <div className="flex justify-end gap-4 mb-4">
            <Button type="primary" onClick={() => setIsPortalModal(true)}>
              Add Portal Name
            </Button>
            <Button type="primary" onClick={handleAddLocation}>
              Add Location
            </Button>
            <Button type="primary" onClick={handleAddCurrency}>
              Add Currency
            </Button>
          </div>

          <div className="flex flex-col gap-7 md:flex-row bg-gray-100">
            <div className="w-full bg-white rounded-lg shadow-md border">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#ECF0FA]">
                    <tr>
                      <th className="p-4 text-[13px] font-[600]">Currency</th>
                      <th className="p-4 text-[13px] font-[600]">
                        Currency Rate
                      </th>
                      <th className="p-4 text-[13px] font-[600]">
                        Commission (%)
                      </th>
                      <th className="p-4 text-[13px] font-[600]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies?.length > 0 ? (
                      currencies.map((currency, index) => (
                        <tr
                          key={currency._id}
                          className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                        >
                          <td className="p-4 text-[13px]">
                            {currency?.currency}
                          </td>
                          <td className="p-4 text-[13px]">
                            1 {currency?.currency} = {currency?.currencyRate}{" "}
                            INR
                          </td>
                          <td className="p-4 text-[13px]">
                            {currency?.charges}%
                          </td>
                          <td className="p-4 text-[13px] flex items-center gap-[10px]">
                            {/* <Popconfirm
                              title="Delete Currency"
                              description="Are you sure you want to delete this currency?"
                              onConfirm={() => handleDelete(currency._id)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button
                                type="primary"
                                danger
                                icon={<FaTrash />}
                                size="small"
                              />
                            </Popconfirm> */}
                            <FiEdit
                              className="text-[24px] bg-green-300 p-[5px] rounded-[3px] text-green-800 cursor-pointer"
                              onClick={() => fn_editCall(currency)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-4 text-gray-500"
                        >
                          <FaExclamationCircle className="inline-block mr-2" />
                          {loading
                            ? "Loading currencies..."
                            : "No currencies found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* create currency modal */}
      <Modal
        title="Add New Currency"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Add Currency"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Currency"
            name="currency"
            rules={[{ required: true, message: "Please enter currency" }]}
          >
            <Input placeholder="Enter currency" />
          </Form.Item>

          <Form.Item
            label={`Currency Rate (INR)`}
            name="currencyRate"
            rules={[{ required: true, message: "Please enter currency rate" }]}
          >
            <Input placeholder="Equal to How much INRs ?" />
          </Form.Item>

          <Form.Item
            label="Commission (%)"
            name="charges"
            rules={[{ required: true, message: "Please enter commission" }]}
          >
            <Input placeholder="Enter Commission in Percentage" />
          </Form.Item>
        </Form>
      </Modal>

      {/* edit currency modal */}
      <Modal
        title="Edit Currency"
        open={editModal}
        onOk={handleModalEdit}
        onCancel={handleModalCancel}
        okText="Edit Currency"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Currency"
            name="currency"
            rules={[{ required: true, message: "Please enter currency" }]}
          >
            <Input placeholder="Enter currency" disabled />
          </Form.Item>

          <Form.Item
            label="Currency Rate (INR)"
            name="currencyRate"
            rules={[{ required: true, message: "Please enter currency rate" }]}
          >
            <Input placeholder="Equal to How much INRs ?" />
          </Form.Item>

          <Form.Item
            label="Commission (%)"
            name="charges"
            rules={[{ required: true, message: "Please enter commission" }]}
          >
            <Input placeholder="Enter Commission in Percentage" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Location Modal */}
      <Modal
        title={<p className="text-[16px] font-[700]">Location Management</p>}
        open={isLocationModalOpen}
        onCancel={handleLocationModalCancel}
        footer={null}
        width={600}
        centered
        style={{ fontFamily: "sans-serif" }}
      >
        <div className="flex flex-col gap-4">
          {/* Top Section */}
          <Form form={locationForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="location"
                  rules={[{ required: true, message: "Please enter location" }]}
                >
                  <Input placeholder="Enter Location" className="text-[12px]" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="exchangeId"
                  rules={[
                    { required: true, message: "Please select exchange" },
                  ]}
                >
                  <Select
                    placeholder="Select Exchange"
                    className="w-full"
                    options={exchanges}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Button
              type="primary"
              className="w-24"
              onClick={handleLocationModalOk}
            >
              Submit
            </Button>
          </Form>

          {/* Divider Line */}
          <div className="border-b-2 border-gray-200 my-4"></div>

          {/* Table Section */}
          <div className="overflow-x-auto max-h-[300px] mb-[20px]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#ECF0FA]">
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Sr. No
                  </th>
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Location
                  </th>
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Exchange
                  </th>
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {locations?.length > 0 ? (
                  [...locations].reverse().map((location, index) => (
                    <tr key={location._id} className="border-b">
                      <td className="p-3 text-[13px]">{index + 1}</td>
                      <td className="p-3 text-[13px]">{location.location}</td>
                      <td className="p-3 text-[13px]">{location.exchangeId?.currency}</td>
                      <td className="p-3 text-[13px]">
                        <Button
                          className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-2 flex items-center justify-center min-w-[32px] h-[32px] border-none"
                          title="Delete"
                          onClick={() => handleDeleteLocation(location._id)}
                        >
                          <FaTrash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="leading-[30px]">
                    <td colSpan="4" className="text-center text-[13px]">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Portal Modal */}
      <Modal
        title={<p className="text-[16px] font-[700]">Portal Management</p>}
        open={portalModal}
        onCancel={handlePortalModalCancel}
        footer={null}
        width={600}
        centered
        style={{ fontFamily: "sans-serif" }}
      >
        <div className="flex flex-col gap-4">
          {/* Top Section */}
          <Form form={portalForm}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="portalName"
                  rules={[{ required: true, message: "Please enter Portal Name" }]}
                >
                  <Input placeholder="Enter Portal Name" className="text-[12px]" onPressEnter={handlePortalModalOk} />
                </Form.Item>
              </Col>
              <Button
                type="primary"
                className="w-24"
                onClick={handlePortalModalOk}
              >
                Submit
              </Button>
            </Row>
          </Form>

          {/* Divider Line */}
          <div className="border-b-2 border-gray-200 my-4"></div>

          {/* Table Section */}
          <div className="overflow-x-auto max-h-[300px] mb-[20px]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#ECF0FA]">
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Sr. No
                  </th>
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Portal Name
                  </th>
                  <th className="p-3 text-[13px] font-[600] text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {portals?.length > 0 ? (
                  [...portals].reverse().map((portal, index) => (
                    <tr key={location._id} className="border-b">
                      <td className="p-3 text-[13px]">{index + 1}</td>
                      <td className="p-3 text-[13px]">{portal.portalName}</td>
                      <td className="p-3 text-[13px]">
                        <Button
                          className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-2 flex items-center justify-center min-w-[32px] h-[32px] border-none"
                          title="Delete"
                          onClick={() => handleDeletePortal(portal._id)}
                        >
                          <FaTrash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="leading-[30px]">
                    <td colSpan="4" className="text-center text-[13px]">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CurrencyExchange;
