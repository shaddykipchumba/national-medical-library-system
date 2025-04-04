// File: resources/js/Pages/Auth/Client/Login.tsx

import { useEffect, FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Form, Input, Button, Checkbox, Row, Col, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

// Declare route function if not globally typed via ziggy.d.ts
declare function route(name: string, params?: any, absolute?: boolean): string;

// Define props passed from ClientLoginController@create
interface Props {
    status?: string;
    canResetPassword?: boolean;
}

// Define the structure of form values for Ant Design's onFinish
interface LoginFormData {
    email?: string;
    password?: string;
    remember?: boolean;
}


export default function ClientLogin({ status, canResetPassword }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Reset password field when component unmounts
    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    // Handler for when Ant Design Form validation passes
    const onFinish = (values: LoginFormData) => {
        // Post form data to the 'client.login' backend route
        post(route('client.login'), {
             onFinish: () => reset('password'), // Reset password after attempt
        });
    };

    return (
        <>
            <Head title="Client Log in" />
            {/* Full viewport height Row to center the Card vertically and horizontally */}
            <Row
                justify="center"
                align="middle"
                style={{ minHeight: '100vh', background: '#f0f2f5' }} // Light grey background
            >
                <Col xs={20} sm={16} md={12} lg={8} xl={6}> {/* Responsive column width */}
                    <Card style={{ boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Typography.Title level={2}>Client Login</Typography.Title>
                            <Typography.Paragraph type="secondary">
                                Welcome back! Please log in to your client account.
                            </Typography.Paragraph>
                        </div>

                        {/* Display session status (e.g., after registration or password reset) */}
                        {status && <Alert message={status} type="success" showIcon closable className="mb-4" />}

                        <Form
                            name="client_login"
                            initialValues={{ remember: data.remember }}
                            onFinish={onFinish}
                            layout="vertical"
                            requiredMark={false}
                        >
                            {/* Email Field */}
                            <Form.Item
                                label="Email"
                                name="email"
                                validateStatus={errors.email ? 'error' : ''}
                                help={errors.email}
                                rules={[{ required: true, message: 'Please input your Email!' }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="site-form-item-icon" />}
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
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="site-form-item-icon" />}
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            {/* Remember Me & Forgot Password Row */}
                            <Form.Item>
                                <Row justify="space-between">
                                    <Col>
                                        <Checkbox
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                        >
                                            Remember me
                                        </Checkbox>
                                    </Col>
                                    {canResetPassword && (
                                        <Col>
                                            <Link
                                                 href={route('password.request')} // Assumes common password reset route
                                                 className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                Forgot password?
                                            </Link>
                                        </Col>
                                    )}
                                </Row>
                            </Form.Item>

                            {/* Submit Button */}
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="login-form-button"
                                    loading={processing} // Show loading state from Inertia
                                    block // Make button full width
                                    size="large"
                                >
                                    Log in
                                </Button>
                            </Form.Item>

                             {/* Link to Client Register */}
                             <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                Don't have an account? <Link href={route('client.register')}>Register now!</Link> {/* CORRECTED: Points to client.register */}
                             </div>

                        </Form>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
