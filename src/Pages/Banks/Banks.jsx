import axios from "axios";
import Cookies from "js-cookie";
import moment from "moment/moment";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Switch, Button, Modal, Input, notification, Pagination } from "antd";

import { FiEdit } from "react-icons/fi";
import { MdDoNotDisturb } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import { MdOutlineCheckCircle } from "react-icons/md";

import upilogo2 from "../../assets/upilogo2.svg";

import { Banks } from "../../json-data/banks";
import BACKEND_URL, { fn_BankUpdate, fn_getAllBanksData, fn_getAllBankLogs, fn_createBankName, fn_getAllBankNames } from "../../api/api";

const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const BankManagement = ({ authorization, showSidebar }) => {

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bankLogs, setBankLogs] = useState([]);
  const [banksData, setBanksData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [state, setState] = useState({ bank: "" });
  const [banksList, setBanksList] = useState(Banks);
  const [currentPage, setCurrentPage] = useState(1);
  const containerHeight = window.innerHeight - 120;
  const [newBankName, setNewBankName] = useState("");
  const [activeTab, setActiveTab] = useState("bank");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [editAccountId, setEditAccountId] = useState(null);
  const [searchBankTerm, setSearchBankTerm] = useState("");
  const [addBankModalOpen, setAddBankModalOpen] = useState(false);
  const [data, setData] = useState({ image: null, bankName: "", accountNo: "", accountType: "", iban: "", accountLimit: "", noOfTrans: "", accountHolderName: "", crypto: "", dailyLimit: "", remainingDailyLimit: "" });

  const fetchAllBanksData = async (tab) => {
    if (tab === "banklogs") {
      setLoadingLogs(true);
      try {
        const result = await fn_getAllBankLogs(currentPage || 1);
        if (result.status) {
          setBankLogs(result.data);
          setTotalPages(result?.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching bank logs:", error);
      } finally {
        setLoadingLogs(false);
      }
    } else {
      try {
        const result = await fn_getAllBanksData(tab);
        if (result.status) {
          setBanksData(result.data?.data);
          setTotalPages(result.data?.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setBanksData([]);
      } finally {
      }
    }
  };

  useEffect(() => {
    const bank = Banks.find((item) => item.title === state.bank);
    if (bank) {
      setSelectedBank(bank);
    }
  }, [state.bank]);

  useEffect(() => {
    window.scroll(0, 0);
    if (!authorization) {
      navigate("/login");
    }
    // setSelectedPage("banks-management");
    fetchAllBanksData(activeTab);
  }, [activeTab]);

  // Add useEffect for page changes
  useEffect(() => {
    fetchAllBanksData(activeTab);
  }, [currentPage, activeTab]);

  // Add function to fetch bank names
  const fetchBankNames = async () => {
    try {
      const response = await fn_getAllBankNames();
      if (response.status) {
        // Combine static Banks with dynamic bank names from API
        const dynamicBanks = response.data.map((bank) => ({
          title: bank.bankName,
          img: "/default-bank-image.png",
        }));
        setBanksList([...dynamicBanks]);
      }
    } catch (error) {
      console.error("Failed to fetch bank names:", error);
    }
  };

  // Add useEffect to fetch bank names on component mount
  useEffect(() => {
    fetchBankNames();
  }, []);

  const handleAddAccount = () => {
    setData({
      image: null,
      bankName: "",
      accountNo: "",
      accountType: "",
      iban: "",
      accountLimit: "",
      noOfTrans: "",
      accountHolderName: "",
      crypto: "",
    });
    setIsEditMode(false);
    setEditAccountId(null);
    setOpen(true);
  };

  const handleInputChange = (evt) => {
    const { name, value } = evt.target;
    if (value === "add_new") {
      setAddBankModalOpen(true);
      return;
    }
    setState((prev) => {
      const updateState = { ...prev, [name]: value };
      if (name === "bank") {
        setData((prevData) => {
          const updatedData = { ...prevData, bankName: value };
          return updatedData;
        });
      }
      return updateState;
    });
  };

  const handleEdit = (account) => {
    setData({
      image: account.image,
      bankName: account.bankName,
      accountNo: account.accountNo,
      iban: account.iban,
      accountLimit: account.accountLimit,
      noOfTrans: account.noOfTrans,
      accountHolderName: account.accountHolderName,
      crypto: account.crypto,
      dailyLimit: account.dailyLimit,
      remainingDailyLimit: account.remainingDailyLimit,
    });
    setEditAccountId(account._id);
    setIsEditMode(true);
    setOpen(true);
  };

  const fn_submit = async () => {
    try {
      if ((activeTab === "upi" || activeTab === "crypto") && !data?.image) {
        notification.error({
          message: "Error",
          description: "QR Code is required",
          placement: "topRight",
        });
        return;
      }

      if (activeTab === "crypto" && !data?.iban) {
        notification.error({
          message: "Error",
          description: "Crypto ID is required",
          placement: "topRight",
        });
        return;
      }

      if (data?.bankName === "") {
        if (activeTab === "bank") {
          notification.error({
            message: "Error",
            description: "Enter Bank Name",
            placement: "topRight",
          });
          return;
        }
      }
      if (data?.accountNo === "") {
        if (activeTab === "bank") {
          notification.error({
            message: "Error",
            description: "Enter Account Number",
            placement: "topRight",
          });
          return;
        }
      }
      if (data?.iban === "" && activeTab !== "crypto") {
        notification.error({
          message: "Error",
          description: `Enter ${activeTab === "bank" ? "IFSC Number" : "UPI ID"
            }`,
          placement: "topRight",
        });
        return;
      }
      if (data?.accountLimit === "") {
        notification.error({
          message: "Error",
          description: "Enter Account Limit",
          placement: "topRight",
        });
        return;
      }
      if (data?.noOfTrans === "") {
        notification.error({
          message: "Error",
          description: "Enter No of Transactions",
          placement: "topRight",
        });
        return;
      }
      if (data?.accountHolderName === "") {
        notification.error({
          message: "Error",
          description: "Enter Account Holder Name",
          placement: "topRight",
        });
        return;
      }
      if (data?.dailyLimit === "" || Number(data?.dailyLimit) <= 0) {
        notification.error({
          message: "Error",
          description: "Enter Daily Transaction Limit Correctly",
          placement: "topRight",
        });
        return;
      }
      const formData = new FormData();
      if (activeTab === "bank") {
        if (data?.image) {
          formData.append("image", data?.image);
        }
        formData.append("bankName", data?.bankName);
        formData.append("dailyLimit", data?.dailyLimit);
        formData.append("remainingDailyLimit", data?.dailyLimit);
        formData.append("accountNo", data?.accountNo);
        formData.append("accountType", activeTab);
        formData.append("iban", data?.iban);
        formData.append("accountLimit", data?.accountLimit);
        formData.append("noOfTrans", data?.noOfTrans);
        formData.append("accountHolderName", data?.accountHolderName);
        formData.append("block", true);
      } else if (activeTab === "crypto") {
        formData.append("image", data?.image);
        formData.append("accountType", activeTab);
        formData.append("iban", data?.iban); // Changed from crypto to iban
        formData.append("accountLimit", data?.accountLimit);
        formData.append("noOfTrans", data?.noOfTrans);
        formData.append("accountHolderName", data?.accountHolderName);
        formData.append("block", true);
        formData.append("dailyLimit", data?.dailyLimit);
        formData.append("remainingDailyLimit", data?.dailyLimit);
      } else {
        if (!data?.image) return;
        formData.append("image", data?.image);
        formData.append("accountType", activeTab);
        formData.append("iban", data?.iban);
        formData.append("accountLimit", data?.accountLimit);
        formData.append("noOfTrans", data?.noOfTrans);
        formData.append("accountHolderName", data?.accountHolderName);
        formData.append("block", true);
        formData.append("dailyLimit", data?.dailyLimit);
        formData.append("remainingDailyLimit", data?.dailyLimit);
      }
      const token = Cookies.get("token");
      let response;
      if (isEditMode) {
        response = await axios.put(
          `${BACKEND_URL}/bank/update/${editAccountId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(`${BACKEND_URL}/bank/create`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      if (response?.status === 200) {
        setOpen(false);
        notification.success({
          message: "Success",
          description: isEditMode
            ? "Bank Updated Successfully!"
            : "Bank Created Successfully!",
          placement: "topRight",
        });
        setData({
          image: null,
          bankName: "",
          accountNo: "",
          iban: "",
          accountLimit: "",
          dailyLimit: "",
          noOfTrans: "",
          accountHolderName: "",
          crypto: "",
        });
        setIsEditMode(false);
        setEditAccountId(null);
        fetchAllBanksData(activeTab);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Network Error";
      notification.error({
        message: "Error",
        description: errorMessage,
        placement: "topRight",
      });
    }
  };

  const handleAddNewBank = async () => {
    if (!newBankName.trim()) {
      notification.error({
        message: "Error",
        description: "Bank name is required",
        placement: "topRight",
      });
      return;
    }

    // Capitalize the bank name before sending to API
    const capitalizedBankName = capitalizeWords(newBankName);

    try {
      const response = await fn_createBankName(capitalizedBankName);

      if (response.status) {
        // Fetch updated bank list instead of just adding to state
        await fetchBankNames();

        // Clear form and close modal
        setNewBankName("");
        setAddBankModalOpen(false);

        notification.success({
          message: "Success",
          description: response.message || "New bank added successfully!",
          placement: "topRight",
        });
      } else {
        notification.error({
          message: "Error",
          description: response.message || "Failed to add bank",
          placement: "topRight",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to add bank",
        placement: "topRight",
      });
    }
  };

  const filteredBankLogs = bankLogs.filter((log) => {
    const searchTerm = searchBankTerm.toLowerCase();
    const bankName = log.bankId?.bankName?.toLowerCase() || "";
    const accountNo = log.bankId?.accountNo?.toLowerCase() || "";
    const upiId = log.bankId?.iban?.toLowerCase() || "";

    return (
      bankName.includes(searchTerm) ||
      accountNo.includes(searchTerm) ||
      upiId.includes(searchTerm)
    );
  });

  return (
    <>
      <div
        className={`bg-gray-100 transition-all duration-500 ${showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
          }`}
        style={{ minHeight: `${containerHeight}px` }}
      >
        <div className="p-7">
          <div className="flex flex-col md:flex-row gap-[12px] items-center justify-between mb-7">
            <h1 className="text-[25px] font-[500]">Banks Details</h1>
            <p className="text-[#7987A1] text-[13px] md:text-[15px] font-[400]">
              Dashboard - Data Table
            </p>
          </div>
          <div className="flex flex-col gap-7 md:flex-row bg-gray-100 ">
            <div className="w-full bg-white rounded-lg shadow-md border">
              {/* Header */}
              <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-b space-y-4 md:space-y-0">
                {/* Tab Buttons */}
                <div className="w-full md:w-auto">
                  <button
                    className="text-[14px] font-[600] px-4 py-2 w-full md:w-auto border-t"
                    style={{
                      backgroundImage:
                        activeTab === "bank"
                          ? "linear-gradient(rgba(8, 100, 232, 0.1), rgba(115, 115, 115, 0))"
                          : "none",
                    }}
                    onClick={() => setActiveTab("bank")}
                  >
                    Bank Accounts
                  </button>
                  <button
                    className="text-[14px] font-[600] px-4 py-2 w-full md:w-auto border-t"
                    style={{
                      backgroundImage:
                        activeTab === "upi"
                          ? "linear-gradient(rgba(8, 100, 232, 0.1), rgba(115, 115, 115, 0))"
                          : "none",
                    }}
                    onClick={() => setActiveTab("upi")}
                  >
                    UPI Accounts
                  </button>

                  <button
                    className="text-[14px] font-[600] px-4 py-2 w-full md:w-auto border-t"
                    style={{
                      backgroundImage:
                        activeTab === "crypto"
                          ? "linear-gradient(rgba(8, 100, 232, 0.1), rgba(115, 115, 115, 0))"
                          : "none",
                    }}
                    onClick={() => setActiveTab("crypto")}
                  >
                    Crypto
                  </button>

                  <button
                    className="text-[14px] font-[600] px-4 py-2 w-full md:w-auto border-t"
                    style={{
                      backgroundImage:
                        activeTab === "disabledBanks"
                          ? "linear-gradient(rgba(8, 100, 232, 0.1), rgba(115, 115, 115, 0))"
                          : "none",
                    }}
                    onClick={() => setActiveTab("disabledBanks")}
                  >
                    Disabled Banks
                  </button>
                  <button
                    className="text-[14px] font-[600] px-4 py-2 w-full md:w-auto border-t"
                    style={{
                      backgroundImage:
                        activeTab === "banklogs"
                          ? "linear-gradient(rgba(8, 100, 232, 0.1), rgba(115, 115, 115, 0))"
                          : "none",
                    }}
                    onClick={() => setActiveTab("banklogs")}
                  >
                    Bank Logs
                  </button>
                </div>
                <div className="flex flex-col md:flex-row items-center space-y-4 justify-end md:space-y-0 md:space-x-4 w-full md:w-auto">
                  {activeTab === "banklogs" && (
                    <input
                      type="text"
                      placeholder="Search by Bank / UPI"
                      value={searchBankTerm}
                      onChange={(e) => setSearchBankTerm(e.target.value)}
                      className="border w-full border-gray-300 rounded py-1.5 text-[12px] pl-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  )}
                  {/* add bank button */}
                  {activeTab !== "disabledBanks" &&
                    activeTab !== "banklogs" && (
                      <Button type="primary" onClick={handleAddAccount}>
                        Add Account
                      </Button>
                    )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#ECF0FA]">
                    <tr>
                      <th className="p-3 text-[13px] font-[600] text-nowrap">
                        Sr. No.
                      </th>
                      {activeTab === "banklogs" && (
                        <th className="p-3 text-[13px] font-[600] text-nowrap">
                          Date
                        </th>
                      )}
                      <th className="p-3 text-[13px] font-[600] text-nowrap">
                        Bank Name
                      </th>
                      {activeTab !== "banklogs" && (
                        <th className="pl-20 text-[13px] font-[600] text-nowrap">
                          {activeTab === "upi" ? "UPI ID" : activeTab === "bank" ? "IFSC" : activeTab === "crypto" ? "Crypto Wallet ID" : ""}
                        </th>
                      )}
                      <th className="p-5 text-[13px] font-[600] whitespace-nowrap">
                        Account Title
                      </th>
                      <th className="p-5 text-[13px] font-[600] text-nowrap">
                        Amount Limit
                      </th>
                      <th className="p-5 text-[13px] font-[600] text-nowrap">
                        {activeTab === "banklogs"
                          ? "Transactions Limit"
                          : "Transactions Limit"}
                      </th>
                      <th className="p-5 text-[13px] font-[600] text-nowrap">
                        Daily Trn. Limit
                      </th>
                      <th className="p-5 text-[13px] font-[600]">Status</th>
                      <th className="p-5 text-[13px] font-[600] pl-10">
                        {activeTab === "banklogs" ? "Reason" : "Action"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "banklogs" ? (
                      loadingLogs ? (
                        <tr>
                          <td colSpan="6" className="text-center p-4">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredBankLogs?.length > 0 ? (
                        filteredBankLogs.map((log, index) => (
                          <tr
                            key={index}
                            className={`border-t border-b ${index % 2 === 0 ? "bg-white" : ""
                              }`}
                          >
                            <td className="p-4 text-[13px] text-nowrap">
                              {(currentPage - 1) * 20 + index + 1}
                            </td>
                            <td className="p-4 text-[13px] text-nowrap">
                              {moment.utc(log?.createdAt).format('DD MMM YYYY, hh:mm A')}
                            </td>
                            <td className="p-2 text-[13px] text-nowrap">
                              {log.bankId?.bankName === "UPI" ? (
                                <div className="flex items-center gap-2">
                                  <span>UPI</span>
                                  <span className="text-gray-600">
                                    - {log.bankId?.iban}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{log.bankId?.bankName}</span>
                                  <span className="text-gray-600">
                                    - {log.bankId?.accountNo}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-[13px] text-nowrap">
                              <div className="ml-2">
                                {log.bankId?.accountHolderName}
                              </div>
                            </td>
                            <td className="p-2 text-[13px]">
                              <div className="ml-3 text-nowrap">
                                ₹ {log.bankId?.accountLimit}
                              </div>
                            </td>
                            <td className="p-2 text-[13px]">
                              <div className="ml-3">
                                {log.bankId?.noOfTrans}
                              </div>
                            </td>
                            <td className="p-2 text-[13px]">
                              <div className="ml-3 text-nowrap">
                                ₹ {log.bankId?.dailyLimit || 0}
                              </div>
                            </td>
                            <td className="text-center">
                              <button
                                className={`px-2 py-[5px] rounded-[20px] w-20 flex items-center justify-center text-[11px] font-[500] ${log.status?.toLowerCase() === "active"
                                  ? "bg-[#DCFCE7] text-[#22C55E]"
                                  : log.status?.toLowerCase() === "inactive"
                                    ? "bg-[#FFE4E4] text-[#DC2626]"
                                    : log.status?.toLowerCase() === "disabled"
                                      ? "bg-[#F3F4F6] text-[#4B5563]"
                                      : log.status?.toLowerCase() === "enable"
                                        ? "bg-[#E0F2FE] text-[#0369A1]"
                                        : "bg-[#F3F4F6] text-[#4B5563]"
                                  }`}
                              >
                                {log.status
                                  ? log.status.charAt(0).toUpperCase() +
                                  log.status.slice(1).toLowerCase()
                                  : "N/A"}
                              </button>
                            </td>
                            <td className="p-3 text-[13px] text-nowrap">
                              {log.reason || "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center p-4">
                            <FaExclamationCircle className="inline-block text-[18px] mt-[-2px] me-[10px]" />
                            No Bank Logs Found
                          </td>
                        </tr>
                      )
                    ) : banksData?.length > 0 ? (
                      banksData?.map((account, index) => {
                        return (
                          <tr
                            key={index}
                            className={`border-t border-b ${index % 2 === 0 ? "bg-white" : ""
                              }`}
                          >
                            <td className="p-4 text-[13px] text-nowrap">
                              {index + 1}
                            </td>
                            <td className="p-3 text-[13px] font-[600]">
                              <div className="flex items-center space-x-2 flex-wrap md:flex-nowrap">
                                {account?.accountType === "crypto" ? (
                                  <div className="flex items-center gap-[3px]">
                                    <span className="whitespace-nowrap">
                                      Crypto
                                    </span>
                                    {/* <span className="text-gray-600 text-nowrap">
                                      - {account.iban}
                                    </span> */}
                                  </div>
                                ) : account?.accountType === "bank" ? (
                                  <div className="flex items-center gap-[3px]">
                                    <span className="whitespace-nowrap capitalize">
                                      {account.bankName}
                                    </span>
                                    <span className="text-gray-600 text-nowrap">
                                      - {account.accountNo}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-[3px]">
                                    <img
                                      src={upilogo2}
                                      alt=""
                                      className="w-[50px]"
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-[13px]">
                              <div className="ml-14">
                                {" "}
                                <span className="whitespace-nowrap">
                                  {account.accountType === "crypto" ? account.iban : account.iban}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-[13px] whitespace-nowrap">
                              <div className="ml-2">
                                {account.accountHolderName}
                              </div>
                            </td>

                            <td className="p-3 text-[13px] font-[400] text-nowrap">
                              <div
                                className="ml-1"
                                style={{
                                  color:
                                    account.remainingLimit === 0
                                      ? "red"
                                      : "inherit",
                                }}
                              >
                                {account.accountType === "crypto" ? "₹" : "₹"} {account.accountLimit} / {" "}
                                {account.accountType === "crypto" ? "₹" : "₹"} {account.remainingLimit}
                              </div>
                            </td>

                            <td className="p-3 text-[13px] font-[400] text-nowrap">
                              <div
                                className="ml-1"
                                style={{
                                  color:
                                    account.remainingTransLimit === 0
                                      ? "red"
                                      : "inherit",
                                }}
                              >
                                {account.noOfTrans} /{" "}
                                {account.remainingTransLimit}
                              </div>
                            </td>
                            <td className="p-3 text-[13px] font-[400] text-nowrap">
                              <div
                                className="ml-1"
                                style={{
                                  color:
                                    account.remainingDailyLimit === 0
                                      ? "red"
                                      : "inherit",
                                }}
                              >
                                ₹ {account.dailyLimit} /{" "}
                                ₹ {account.remainingDailyLimit}
                              </div>
                            </td>
                            <td className="text-center">
                              <button
                                className={`px-3 py-[5px]  rounded-[20px] w-20 flex items-center justify-center text-[11px] font-[500] ${account?.block === false
                                  ? "bg-[#10CB0026] text-[#0DA000]"
                                  : "bg-[#FF173D33] text-[#D50000]"
                                  }`}
                              >
                                {!account?.block ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center items-center ml-6">
                                {activeTab !== "disabledBanks" ? (
                                  <>
                                    <Switch
                                      size="small"
                                      checked={!account?.block}
                                      onChange={async (checked) => {
                                        try {
                                          const response = await fn_BankUpdate(
                                            account?._id,
                                            {
                                              block: !checked,
                                              accountType: account.accountType
                                            }
                                          );
                                          if (response?.status) {
                                            fetchAllBanksData(activeTab);
                                            notification.success({
                                              message: "Status Updated",
                                              description: checked
                                                ? `${account.accountType.toUpperCase()} Activated`
                                                : `${account.accountType.toUpperCase()} Deactivated`,
                                              placement: "topRight",
                                            });
                                          } else {
                                            notification.error({
                                              message: "Error",
                                              description:
                                                response.message ||
                                                `Failed to update ${account.accountType} status`,
                                              placement: "topRight",
                                            });
                                          }
                                        } catch (error) {
                                          notification.error({
                                            message: "Error",
                                            description: `Failed to update ${account.accountType} status`,
                                            placement: "topRight",
                                          });
                                        }
                                      }}
                                    />
                                    <Button
                                      className="bg-green-100 text-green-600 rounded-full px-2 py-2 mx-2"
                                      title="Edit"
                                      onClick={() => handleEdit(account)}
                                    >
                                      <FiEdit />
                                    </Button>
                                    <Button
                                      className="bg-red-100 text-red-600 rounded-full px-2 py-2"
                                      title="Disable"
                                      onClick={async () => {
                                        try {
                                          const response = await fn_BankUpdate(
                                            account?._id,
                                            {
                                              disable: true,
                                              block: true
                                            }
                                          );
                                          if (response?.status) {
                                            fetchAllBanksData(activeTab);
                                            notification.success({
                                              message: "Status Updated",
                                              description:
                                                "Bank has been moved to disabled banks",
                                              placement: "topRight",
                                            });
                                          }
                                        } catch (error) {
                                          notification.error({
                                            message: "Error",
                                            description:
                                              "Failed to disable bank",
                                            placement: "topRight",
                                          });
                                        }
                                      }}
                                    >
                                      <MdDoNotDisturb size={18} />
                                    </Button>
                                    <Button
                                      className="bg-red-100 text-red-600 rounded-full px-2 py-2 text-[11px] ms-[5px]"
                                      title="Reset Limit"
                                      onClick={async () => {
                                        const response = await fn_BankUpdate(
                                          account?._id,
                                          {
                                            remainingLimit: account?.accountLimit,
                                            remainingTransLimit: account?.noOfTrans
                                          }
                                        );
                                        if (response?.status) {
                                          fetchAllBanksData(activeTab);
                                          notification.success({
                                            message: "Bank Updated",
                                            description: "Bank Limit Released",
                                            placement: "topRight",
                                          });
                                        }
                                      }}
                                    >
                                      Reset Limit
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      className="bg-green-100 text-green-600 rounded-full px-2 py-2 mr-2"
                                      title="Enable"
                                      onClick={async () => {
                                        try {
                                          const response = await fn_BankUpdate(
                                            account?._id,
                                            {
                                              disable: false,
                                            }
                                          );
                                          if (response?.status) {
                                            fetchAllBanksData(activeTab);
                                            notification.success({
                                              message: "Status Updated",
                                              description:
                                                "Bank has been enabled",
                                              placement: "topRight",
                                            });
                                          }
                                        } catch (error) {
                                          notification.error({
                                            message: "Error",
                                            description:
                                              "Failed to enable bank",
                                            placement: "topRight",
                                          });
                                        }
                                      }}
                                    >
                                      <MdOutlineCheckCircle size={18} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="h-[50px]">
                        <td
                          colSpan="7"
                          className="text-center text-[13px] font-[500] italic text-gray-600"
                        >
                          <FaExclamationCircle className="inline-block text-[18px] mt-[-2px] me-[10px]" />
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Add pagination below table */}
                <div className="flex flex-col md:flex-row items-center p-4 justify-between space-y-4 md:space-y-0">
                  <p className="text-[13px] font-[500] text-gray-500 text-center md:text-left"></p>
                  {activeTab !== "banklogs" ? (
                    <Pagination
                      className="self-center md:self-auto"
                      onChange={(page) => setCurrentPage(page)}
                      current={currentPage}
                      total={(totalPages * 20) / 2}
                      showQuickJumper={false}
                      showSizeChanger={false}
                    />
                  ) : (
                    <Pagination
                      className="self-center md:self-auto"
                      onChange={(page) => setCurrentPage(page)}
                      current={currentPage}
                      total={(totalPages * 20) / 2}
                      showQuickJumper={false}
                      showSizeChanger={false}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        centered
        width={600}
        open={open}
        style={{ fontFamily: "sans-serif" }}
        title={
          <p className="text-[16px] font-[700]">
            {isEditMode ? "Edit Your Bank Account" : "Add New Bank Account"}
          </p>
        }
        footer={
          <div className="flex gap-4 mt-6">
            <Button
              className="flex start px-10 text-[12px]"
              type="primary"
              onClick={fn_submit}
            >
              Save
            </Button>
            <Button
              className="flex start px-10 bg-white text-[#FF3D5C] border border-[#FF7A8F] text-[12px]"
              type=""
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        }
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        {activeTab === "bank" && (
          <>
            {/* bank image */}
            {selectedBank && (
              <div className="w-[120px] h-[120px]">
                <img alt="" src={selectedBank?.img} />
              </div>
            )}
            <div className="flex gap-4 ">
              {/* bank name */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Bank Name <span className="text-[#D50000]">*</span>
                </p>
                <select
                  name="bank"
                  value={data?.bankName || ""}
                  onChange={handleInputChange}
                  className="w-full  text-[12px] border border-[#d9d9d9] h-[28.84px] px-[11px] py-[4px] rounded-[6px]"
                >
                  <option value="" disabled>
                    ---Select Bank---
                  </option>
                  {banksList.map((item, index) => (
                    <option key={index} value={item.title}>
                      {capitalizeWords(item.title)}
                    </option>
                  ))}
                  <option
                    value="add_new"
                    style={{
                      backgroundColor: "#0050B3 ",
                      color: "white",
                      fontWeight: "500",
                    }}
                  >
                    + Add New Bank
                  </option>
                </select>
              </div>
              {/* Account Number */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Number <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.accountNo}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, accountNo: e.target.value }))
                  }
                  className="w-full  text-[12px]"
                  placeholder="Enter Account Number"
                />
              </div>
            </div>
            <div className="flex gap-4">
              {/* IFCS No. */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  {activeTab === "bank" ? (
                    <>
                      IFSC No. <span className="text-[#D50000]">*</span>
                    </>
                  ) : (
                    <>
                      UPI ID <span className="text-[#D50000]">*</span>
                    </>
                  )}
                </p>
                <Input
                  value={data?.iban}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, iban: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder={`${activeTab === "bank" ? "Enter IFSC Number" : "Enter UPI ID"
                    }`}
                />
              </div>
              {/* account Holder Name */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Holder Name <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.accountHolderName}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Account Holder Name"
                />
              </div>
            </div>
            <div className="flex gap-4">
              {/* Account Limit */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Limit <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.accountLimit}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, accountLimit: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Account Limit "
                />
              </div>
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  No of Transactions <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.noOfTrans}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, noOfTrans: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="No of Transactions"
                />
              </div>
            </div>
            {/* daily limit */}
            <div className="flex gap-4">
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Daily Transaction Limit <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  prefix={"₹"}
                  type="number"
                  min={1}
                  value={data?.dailyLimit}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, dailyLimit: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Daily Transaction Limit"
                />
              </div>
            </div>
          </>
        )}
        {activeTab === "crypto" && (
          <>
            <div className="flex gap-4">
              {/* Crypto ID */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Crypto Wallet ID <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.iban}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, iban: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Enter Crupto Wallet ID"
                />
              </div>
              {/* Account Holder Name */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Holder Name <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.accountHolderName}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Account Holder Name"
                />
              </div>
            </div>
            <div className="flex gap-4">
              {/* Account Limit */}
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Limit <span className="text-[#D50000]">*</span>
                  {activeTab === "crypto" && (
                    <span className="ml-2 text-gray-500">(₹)</span>
                  )}
                </p>
                <div className="relative">
                  <Input
                    value={data?.accountLimit}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, accountLimit: e.target.value }))
                    }
                    className={`w-full text-[12px] ${activeTab === "crypto" ? "pr-8" : ""}`}
                    placeholder="Account Limit"
                  />
                  {activeTab === "crypto" && (
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  No of Transactions <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.noOfTrans}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, noOfTrans: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="No of Transactions"
                />
              </div>
            </div>
            {/* Crypto QR Code */}
            <div className="flex-1 my-2">
              <p className="text-[12px] font-[500] pb-1">
                Crypto QR Code <span className="text-[#D50000]">*</span>
              </p>
              <Input
                type="file"
                required
                onChange={(e) =>
                  setData((prev) => ({ ...prev, image: e.target.files[0] }))
                }
                className="w-full text-[12px]"
                placeholder="Select QR Code"
              />
            </div>
            {/* daily limit */}
            <div className="flex gap-4">
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Daily Transaction Limit <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  prefix={"₹"}
                  value={data?.dailyLimit}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, dailyLimit: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Daily Transaction Limit"
                />
              </div>
            </div>
          </>
        )}
        {activeTab === "upi" && (
          <>
            <div className="flex gap-4">
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  UPI ID <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.iban}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, iban: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Enter UPI ID"
                />
              </div>
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Holder Name <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.accountHolderName}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Account Holder Name"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Account Limit <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.accountLimit}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, accountLimit: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Account Limit"
                />
              </div>
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  No of Transactions <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  value={data?.noOfTrans}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, noOfTrans: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="No of Transactions"
                />
              </div>
            </div>
            <div className="flex-1 my-2">
              <p className="text-[12px] font-[500] pb-1">
                UPI QR Code <span className="text-[#D50000]">*</span>
              </p>
              <Input
                type="file"
                required
                onChange={(e) =>
                  setData((prev) => ({ ...prev, image: e.target.files[0] }))
                }
                className="w-full text-[12px]"
                placeholder="Select QR Code"
              />
            </div>
            {/* daily limit */}
            <div className="flex gap-4">
              <div className="flex-1 my-2">
                <p className="text-[12px] font-[500] pb-1">
                  Daily Transaction Limit <span className="text-[#D50000]">*</span>
                </p>
                <Input
                  prefix={"₹"}
                  value={data?.dailyLimit}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, dailyLimit: e.target.value }))
                  }
                  className="w-full text-[12px]"
                  placeholder="Daily Transaction Limit"
                />
              </div>
            </div>
          </>
        )}
      </Modal>
      <Modal
        centered
        width={400}
        open={addBankModalOpen}
        title={<p className="text-[16px] font-[700]">Add New Bank</p>}
        footer={
          <div className="flex gap-4 mt-6">
            <Button
              className="flex start px-10 text-[12px]"
              type="primary"
              onClick={handleAddNewBank}
            >
              Add Bank
            </Button>
            <Button
              className="flex start px-10 bg-white text-[#FF3D5C] border border-[#FF7A8F] text-[12px]"
              onClick={() => setAddBankModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        }
        onCancel={() => setAddBankModalOpen(false)}
      >
        <div className="flex-1 my-2">
          <p className="text-[12px] font-[500] pb-1">
            Bank Name <span className="text-[#D50000]">*</span>
          </p>
          <Input
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            className="w-full text-[12px]"
            placeholder="Enter Bank Name"
          />
        </div>
      </Modal>
    </>
  );
};

export default BankManagement;
