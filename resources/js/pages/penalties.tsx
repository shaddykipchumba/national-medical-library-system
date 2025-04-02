import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  message,
  Breadcrumb,
  Spin
} from 'antd';
import moment from 'moment';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface Penalty {
  id: number;
  client_name: string;
  client_phone: string;
  date_to_be_returned: string;
  days_overdue: number;
  fee_amount: number; // Assume this is the per-day penalty rate
}

interface PaymentPayload {
  client_name: string;
  client_phone: string;
  amount_payed: number;
  date_payed: string;
}

const Penalties: React.FC = () => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Fetch penalty records from the API
  const fetchPenalties = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/penalties');
      if (response.ok) {
        const data = await response.json();
        setPenalties(data.penalties);
      } else {
        message.error('Failed to fetch penalties.');
      }
    } catch (error) {
      message.error('Error fetching penalties.');
    }
    setLoading(false);
  };

  // Refresh penalties: recalculate overdue days and update fee amounts
  const refreshPenalties = () => {
    const updated = penalties.map((penalty) => {
      const dueDate = moment(penalty.date_to_be_returned);
      const currentDate = moment();
      let newDaysOverdue = currentDate.diff(dueDate, 'days');
      if (newDaysOverdue < 0) newDaysOverdue = 0;
      const updatedFee = penalty.fee_amount * newDaysOverdue;
      return { ...penalty, days_overdue: newDaysOverdue, fee_amount: updatedFee };
    });
    setPenalties(updated);
    message.success('Penalties refreshed successfully.');
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  // Open the modal to relieve penalty for a specific record
  const handleRelieve = (penalty: Penalty) => {
    setSelectedPenalty(penalty);
    form.resetFields();
    setModalVisible(true);
  };

  // Confirm relieve action: create a payment record and delete the penalty record
  const handleConfirmRelieve = async () => {
    try {
      await form.validateFields();
      if (!selectedPenalty) return;
      setPaymentLoading(true);

      const payload: PaymentPayload = {
        client_name: selectedPenalty.client_name,
        client_phone: selectedPenalty.client_phone,
        amount_payed: Number(selectedPenalty.fee_amount) || 0,
        date_payed: moment().format('YYYY-MM-DD HH:mm:ss'),
      };

      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

      // Step 1: Add payment record
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify(payload),
      });

      if (!paymentResponse.ok) {
        message.error('Failed to record payment.');
        setPaymentLoading(false);
        return;
      }

      // Step 2: Delete the penalty record after successful payment
      const deleteResponse = await fetch(`/api/penalties/${selectedPenalty.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
        },
      });

      if (deleteResponse.ok) {
        message.success('Payment recorded and penalty removed.');
        setPenalties((prev) => prev.filter((p) => p.id !== selectedPenalty.id));
        setModalVisible(false);
      } else {
        message.error('Payment recorded, but failed to remove penalty.');
      }
    } catch (error) {
      message.error('Please fill in the required fields.');
    }
    setPaymentLoading(false);
  };

  // Define columns for the penalties table
  const columns = [
    {
      title: 'Client Name',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Client Phone',
      dataIndex: 'client_phone',
      key: 'client_phone',
    },
    {
      title: 'Date to be Returned',
      dataIndex: 'date_to_be_returned',
      key: 'date_to_be_returned',
      render: (date: string) => moment(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Days Overdue',
      dataIndex: 'days_overdue',
      key: 'days_overdue',
    },
    {
      title: 'Fee Amount',
      dataIndex: 'fee_amount',
      key: 'fee_amount',
      render: (amount: any) => `KSH ${(Number(amount) || 0).toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Penalty) => (
        <Button type="primary" onClick={() => handleRelieve(record)}>
          Relieve
        </Button>
      ),
    },
  ];

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Penalties', href: '/penalties' }]}>
      <Head title="Penalties" />
      <div style={{ padding: '16px' }}>
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item>Penalties</Breadcrumb.Item>
        </Breadcrumb>
        <Card title="Penalties">
          <Button onClick={refreshPenalties} style={{ marginBottom: 16 }}>
            Refresh Penalties
          </Button>
          {loading ? (
            <Spin size="large" />
          ) : (
            <Table dataSource={penalties} columns={columns} rowKey="id" />
          )}
        </Card>

        <Modal
          title="Relieve Penalty"
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleConfirmRelieve}
          confirmLoading={paymentLoading}
        >
          {selectedPenalty && (
            <>
              <p>
                <strong>Amount Owed:</strong>{' '}${(Number(selectedPenalty.fee_amount) || 0).toFixed(2)}
              </p>
              <Form form={form} layout="vertical">
                <Form.Item
                  name="mode_of_payment"
                  label="Mode of Payment"
                  rules={[{ required: true, message: 'Please enter the mode of payment' }]}
                >
                  <Input placeholder="e.g., Cash, Card" />
                </Form.Item>
              </Form>
            </>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default Penalties;
