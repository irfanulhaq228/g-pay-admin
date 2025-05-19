import Cookies from "js-cookie";
import OtpInput from 'react-otp-input';
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Grid, Input, Modal, Typography, notification, } from "antd";

import logo from "../../assets/logo.png";
import { fn_loginAdminApi, fn_otpVerifyApi } from "../../api/api";


const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const Login = ({ authorization, setAuthorization }) => {

  const resendTimer = 10;
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState('');
  const [otpModal, setOtpModal] = useState(false);
  const [timer, setTimer] = useState(resendTimer || 10);
  const [loginLoader, setLoginLoader] = useState(false);
  const [verifyLoader, setVerifyLoader] = useState(false);

  useEffect(() => {
    if (authorization) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    if (otpModal) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [otpModal]);

  const onFinish = async (values) => {
    try {
      setLoginLoader(true);
      const response = await fn_loginAdminApi(values);
      if (response?.status) {
        notification.success({
          message: "OTP sent Successful",
          description: "Check your email for the OTP",
          placement: "topRight",
        });
        setOtpModal(true);
        setLoginLoader(false);
        // Cookies.set("token", response?.token);
        // Cookies.set("adminId", response?.id);
        // Cookies.set("type", response?.type);
        // Cookies.set("staffType", response?.staffType);
        // if (response?.type === "admin") {
        //   navigate("/");
        // } else {
        //   if (response?.staffType === "transaction") {
        //     navigate("/transactions");
        //   } else {
        //     navigate("/withdraw");
        //   }
        // }
        // setAuthorization(true);
      } else {
        setLoginLoader(false);
        notification.error({
          message: "Login Failed",
          description:
            response?.message ,
          placement: "topRight",
        });
      };
    } catch (error) {
      console.error("Login error: ", error);
      setLoginLoader(false);
      notification.error({
        message: "Error",
        description: "An unexpected error occurred. Please try again later.",
        placement: "topRight",
      });
    }
  };

  const styles = {
    container: {
      margin: "0 auto",
      padding: screens.md ? "40px" : "30px 15px",
      width: "380px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    footer: {
      marginTop: "20px",
      textAlign: "center",
      width: "100%",
    },
    forgotPassword: {
      float: "right",
    },
    header: {
      marginBottom: "30px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    section: {
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      display: "flex",
      height: screens.sm ? "100vh" : "auto",
      padding: "40px 0",
    },
    text: {
      color: "#6c757d",
    },
    title: {
      fontSize: screens.md ? "24px" : "20px",
      marginTop: "10px",
    },
    logo: {
      width: "80px",
      height: "auto",
    },
  };

  const fn_resendOtp = async () => {
    await onFinish({ email, password });
    setTimer(resendTimer);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 60 ? "0" : ""}${secs}`;
  };

  const fn_closeOtpModal = () => {
    setOtpModal(false);
    clearInterval(timerRef.current);
  };

  const fn_verifyOTP = async () => {
    setVerifyLoader(true);
    const response = await fn_otpVerifyApi({ email, otp, password });
    if (response?.status) {
      notification.success({
        message: "Login Successful",
        description: "You have successfully logged in.",
        placement: "topRight",
      });
      setVerifyLoader(false);
      Cookies.set("token", response?.token);
      Cookies.set("adminId", response?.id);
      Cookies.set("type", response?.type);
      Cookies.set("staffType", response?.staffType);
      if (response?.type === "admin") {
        navigate("/");
      } else {
        if (response?.staffType === "transaction") {
          navigate("/transactions");
        } else {
          navigate("/withdraw");
        }
      }
      
      setAuthorization(true);
    } else {
      setVerifyLoader(false);
      notification.error({
        message: "Login Failed",
        description:
          response?.message,
        placement: "topRight",
      });
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={logo} alt="Logo" style={styles.logo} />
          <Title style={styles.title}>Admin Login</Title>
          <Text style={styles.text}>
            Welcome back! Please enter your details below to log in as an admin.
          </Text>
        </div>
        <Form
          name="admin_login"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            rules={[
              {
                type: "email",
                required: true,
                message: "Please input your Email!",
              },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            rules={[
              {
                required: true,
                message: "Please input your Password!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              type="password"
              placeholder="Password"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: "0px" }}>
            <Button block type="primary" htmlType="submit" loading={loginLoader}>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
      <Modal title="Enter OTP" open={otpModal} onClose={fn_closeOtpModal} onCancel={fn_closeOtpModal} centered width={400} style={{ fontFamily: "sans-serif" }} footer={null}>
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center mt-[23px] mb-[10px] w-[max-content] gap-[20px]">
            <OtpInput
              value={otp}
              numInputs={6}
              onChange={setOtp}
              renderSeparator={<span className='mx-[5px]'></span>}
              renderInput={(props) => <input {...props} />}
              inputStyle={{ width: "45px", height: "45px", border: "1px solid gray", fontSize: "17px", fontWeight: "600", borderRadius: "8px" }}
            />
            <div className="w-full">
              <Button type="primary" loading={verifyLoader} className="h-[35px] text-[14px] font-[500] text-white w-full bg-[#1476ff] rounded-[8px]" onClick={fn_verifyOTP}>Verify OTP</Button>
            </div>
            {timer > 0 ? (
              <div className="text-[13px] text-gray-800">
                Resend OTP in <span className="font-[600]">{formatTime(timer)}</span>
              </div>
            ) : (
              <div
                className="text-[14px] text-blue-600 cursor-pointer hover:underline"
                onClick={fn_resendOtp}
              >
                Resend OTP
              </div>
            )}
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default Login;
