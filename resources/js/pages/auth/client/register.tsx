import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Form, Input, Button, Row, Col, Card, Typography, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons'; // Import necessary icons

// Declare route function if not globally typed via ziggy.d.ts
declare function route(name: string, params?: any, absolute?: boolean): string;

// Define the structure of form values for Ant Design's onFinish
interface RegisterFormData {
    name?: string;
    idNumber?: string;      // Field for Client model
    phoneNumber?: string;   // Field for Client model
    email?: string;
    password?: string;
    password_confirmation?: string;
}

export default function ClientRegister() {
    // useForm hook includes fields for the Client model
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        idNumber: '',        // Initialize state
        phoneNumber: '',     // Initialize state
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Reset password fields on component unmount
    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    // Handler for form submission via Ant Design's onFinish
    const onFinish = (values: RegisterFormData) => {
        // Post form data to the 'client.register' route
        post(route('client.register'), {
            // Reset password fields after the submission attempt
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Client Registration" />
            {/* Full viewport height Row for centering */}
            <Row
                justify="center"
                align="middle"
                style={{ minHeight: '100vh', background: '#f0f2f5', padding: '20px 0' }} // Added padding
            >
                <Col xs={20} sm={16} md={12} lg={10} xl={8}> {/* Adjusted width for fields */}
                    <Card style={{ boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Typography.Title level={2}>Client Registration</Typography.Title>
                            <Typography.Paragraph type="secondary">
                                Create your client account to get started.
                            </Typography.Paragraph>
                        </div>

                        <Form
                            name="client_register"
                            onFinish={onFinish}
                            layout="vertical"
                            requiredMark={false}
                        >
                            {/* Name Field */}
                            <Form.Item
                                label="Name"
                                name="name"
                                validateStatus={errors.name ? 'error' : ''}
                                help={errors.name}
                                rules={[{ required: true, message: 'Please input your Name!', whitespace: true }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Full Name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            {/* ID Number Field */}
                             <Form.Item
                                label="ID Number"
                                name="idNumber"
                                validateStatus={errors.idNumber ? 'error' : ''}
                                help={errors.idNumber}
                                rules={[{ required: true, message: 'Please input your ID Number!'}]}
                            >
                                <Input
                                    prefix={<IdcardOutlined />}
                                    placeholder="National ID or Passport Number"
                                    value={data.idNumber}
                                    onChange={(e) => setData('idNumber', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                             {/* Phone Number Field */}
                             <Form.Item
                                label="Phone Number"
                                name="phoneNumber"
                                validateStatus={errors.phoneNumber ? 'error' : ''}
                                help={errors.phoneNumber}
                                rules={[{ required: true, message: 'Please input your Phone Number!'}]}
                            >
                                <Input
                                    prefix={<PhoneOutlined />}
                                    placeholder="e.g., +2547XXXXXXXX" // Placeholder relevant to Kenya
                                    value={data.phoneNumber}
                                    onChange={(e) => setData('phoneNumber', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            {/* Email Field */}
                            <Form.Item
                                label="Email"
                                name="email"
                                validateStatus={errors.email ? 'error' : ''}
                                help={errors.email}
                                rules={[{ required: true, message: 'Please input your Email!', type: 'email' }]}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder="Email Address"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            {/* Password Field */}
                            <Form.Item
                                label="Password"
                                name="password"
                                validateStatus={errors.password ? 'error' : ''}
                                help={errors.password}
                                rules={[{ required: true, message: 'Please input your Password!' }]}
                                hasFeedback
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            {/* Confirm Password Field */}
                            <Form.Item
                                label="Confirm Password"
                                name="password_confirmation"
                                dependencies={['password']} // For matching rule
                                validateStatus={errors.password_confirmation ? 'error' : ''}
                                help={errors.password_confirmation}
                                hasFeedback
                                rules={[
                                    { required: true, message: 'Please confirm your Password!' },
                                    // Rule to check if passwords match
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Confirm Password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            {/* Submit Button */}
                            <Form.Item style={{ marginTop: '24px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processing}
                                    block
                                    size="large"
                                >
                                    Register Client Account
                                </Button>
                            </Form.Item>

                             {/* Link back to Client Login */}
                             <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                Already have an account? <Link href={route('client.login')}>Log in here!</Link>
                             </div>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
