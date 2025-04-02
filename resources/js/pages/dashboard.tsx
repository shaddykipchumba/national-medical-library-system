import React from 'react';
import { Card, Statistic, Row, Col, Table, Typography, Space } from 'antd';
import { Line } from '@ant-design/plots';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const { Title } = Typography;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const assignedBooks = 50;
const availableBooks = 100;

const weeklyBorrowingData = [
    { week: 'Mon', value: 15 },
    { week: 'Tue', value: 20 },
    { week: 'Wed', value: 18 },
    { week: 'Thu', value: 25 },
    { week: 'Fri', value: 30 },
    { week: 'Sat', value: 10 },
    { week: 'Sun', value: 5 },
];

const borrowingConfig = {
    data: weeklyBorrowingData,
    xField: 'week',
    yField: 'value',
    point: {
        size: 5,
        shape: 'circle',
        style: {
            fill: '#1890ff',
            stroke: '#1890ff',
        },
    },
    lineStyle: {
        lineWidth: 3,
        stroke: '#1890ff',
    },
    area: {
        style: {
            fill: 'l(90) 0:#ffffff 1:#d9eaff',
        },
    },
    smooth: true,
    animation: {
        appear: {
            animation: 'path-in',
            duration: 500,
        },
    },
};

const defaultBooksData = [
    { key: '1', title: 'Robbins Pathologic Basis of Disease', daysLeft: 2, user: 'Jane Smith' },
    { key: '2', title: 'Medical Physiology', daysLeft: 5, user: 'John Doe' },
    { key: '3', title: 'Gray\'s Anatomy', daysLeft: 1, user: 'David Lee' },
];

const defaultBooksColumns = [
    { title: 'Book Title', dataIndex: 'title', key: 'title' },
    { title: 'Days Left', dataIndex: 'daysLeft', key: 'daysLeft' },
    { title: 'User', dataIndex: 'user', key: 'user' },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4">
                <Title level={2}>Dashboard</Title>
                <Row gutter={16}>
                    <Col span={12}>
                        <Card>
                            <Statistic title="Assigned Books" value={assignedBooks} />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card>
                            <Statistic title="Available Books" value={availableBooks} />
                        </Card>
                    </Col>
                </Row>
                <Card>
                    <Title level={4}>Weekly Borrowing</Title>
                    <Line {...borrowingConfig} />
                </Card>
                <Card>
                    <Title level={4}>Books Almost Reaching Default</Title>
                    <Table dataSource={defaultBooksData} columns={defaultBooksColumns} />
                </Card>
            </div>
        </AppLayout>
    );
}