import { useEffect, FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
// --- Ant Design Imports ---
import { Form, Input, Button, Checkbox, Row, Col, Typography, Alert, Space, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
// --- Layout Import ---
import AuthLayout from '@/layouts/auth-layout'; // ****** USE YOUR AUTH LAYOUT ******
// --- Type Imports ---
import type { PageProps } from '@/types';

// Declare route function if not globally typed
declare function route(name: string, params?: any, absolute?: boolean): string;

interface Props extends PageProps {
    status?: string;
    canResetPassword?: boolean;
}

interface LoginFormData {
    email?: string;
    password?: string;
    remember?: boolean;
}

export default function Login({ status, canResetPassword }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const onFinish = (values: LoginFormData) => {
        post(route('login'), { // Submits to Admin login route
            onFinish: () => reset('password'),
        });
    };

    return (
        // Use AuthLayout as the main wrapper, passing title and description
        <AuthLayout
            title="Admin Login"
            description="Enter your credentials to access the administration panel."
        >
            <Head title="Admin Log in" /> {/* Head still sets browser tab title */}

            {/* Status message display */}
            {status && <Alert message={status} type="success" showIcon closable className="mb-4" />}

            {/* Ant Design Form */}
            <Form
                name="admin_login"
                initialValues={{ remember: data.remember }}
                onFinish={onFinish}
                layout="vertical"
                requiredMark={false}
                // Remove extra top margin if AuthLayout provides spacing
                // style={{ marginTop: '24px' }}
            >
                {/* Email Field */}
                <Form.Item
                    // Removed label prop if AuthLayout shows title/desc
                    name="email"
                    validateStatus={errors.email ? 'error' : ''}
                    help={errors.email}
                    rules={[{ required: true, message: 'Please input your Email!' }]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="Admin Email (e.g., admin@example.com)"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        size="large"
                        autoFocus
                    />
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                    // Removed label prop if AuthLayout shows title/desc
                    name="password"
                    validateStatus={errors.password ? 'error' : ''}
                    help={errors.password}
                    rules={[{ required: true, message: 'Please input your Password!' }]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
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
                                     href={route('password.request')}
                                     className="text-sm text-blue-600 hover:text-blue-800" // Adjust class if needed
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
                        loading={processing}
                        block
                        size="large"
                    >
                        Log in as Admin
                    </Button>
                </Form.Item>

                {/* Link to Admin Register */}
                 <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
                    Need an admin account?{' '}
                    <Link href={route('register')}> {/* Points to ADMIN register */}
                        Sign up
                    </Link>
                 </div>

                <Divider>Or</Divider>

                {/* Button to switch to Client Login */}
                <Form.Item>
                    <Link href={route('client.login')} style={{ display: 'block', width: '100%' }}>
                        <Button type="default" block size="large">
                            Login as Client instead
                        </Button>
                    </Link>
                </Form.Item>

            </Form>
        </AuthLayout> // Close AuthLayout
    );
}

// Remove the explicit layout assignment, as AuthLayout is now used directly
// Login.layout = (page: React.ReactElement) => <GuestLayout children={page} />;
