import { useEffect, FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
// --- Ant Design Imports ---
import { Form, Input, Button, Row, Col, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
// --- Layout Import ---
import AuthLayout from '@/layouts/auth-layout'; // ****** USE YOUR AUTH LAYOUT ******
// --- Type Imports ---
import type { PageProps } from '@/types';

// Declare route function if not globally typed
declare function route(name: string, params?: any, absolute?: boolean): string;

// Props interface - Register likely doesn't need specific props from controller
interface Props extends PageProps {}

// Form data structure
type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
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

    // Handler for Ant Design Form submission
    const onFinish = (values: Partial<RegisterForm>) => { // values from antd aren't used directly, we use Inertia's 'data'
        // Post Inertia form data to the 'register' route (Admin registration)
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        // Use AuthLayout wrapper
        <AuthLayout
            title="Create Admin Account"
            description="Enter details below to create a new administrator account."
        >
            <Head title="Admin Register" />

            {/* Ant Design Form */}
            <Form
                name="admin_register"
                onFinish={onFinish}
                layout="vertical"
                requiredMark={false}
                // style={{ marginTop: '24px' }} // Adjust margin if needed within AuthLayout
            >
                {/* Name Field */}
                <Form.Item
                    // label="Admin Name" // Label might be redundant if AuthLayout has titles
                    name="name" // Helps antd link label/errors if label were present
                    validateStatus={errors.name ? 'error' : ''}
                    help={errors.name}
                    rules={[{ required: true, message: 'Please input the Admin Name!', whitespace: true }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Full Name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        size="large"
                        autoFocus
                    />
                </Form.Item>

                {/* Email Field */}
                <Form.Item
                    // label="Admin Email"
                    name="email"
                    validateStatus={errors.email ? 'error' : ''}
                    help={errors.email}
                    rules={[{ required: true, message: 'Please input the Admin Email!', type: 'email' }]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="Admin Email Address"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        size="large"
                    />
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                    // label="Password"
                    name="password"
                    validateStatus={errors.password ? 'error' : ''}
                    help={errors.password}
                    rules={[{ required: true, message: 'Please input the Password!' }]}
                    hasFeedback // Adds icon feedback based on validation status
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
                    // label="Confirm Password"
                    name="password_confirmation"
                    dependencies={['password']} // Crucial for matching rule
                    validateStatus={errors.password_confirmation ? 'error' : ''}
                    help={errors.password_confirmation}
                    hasFeedback
                    rules={[
                        { required: true, message: 'Please confirm the Password!' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two passwords do not match!'));
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
                        loading={processing} // Use antd loading state
                        block
                        size="large"
                    >
                        Create Admin Account
                    </Button>
                </Form.Item>

                 {/* Link back to Admin Login */}
                 <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    Already have an admin account?{' '}
                    <Link href={route('login')} className="text-blue-600 hover:text-blue-800"> {/* Added basic link style */}
                        Log in
                    </Link>
                 </div>
            </Form>
        </AuthLayout>
    );
}

// No explicit layout assignment needed as AuthLayout is used directly
