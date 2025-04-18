import React, { useState, useEffect } from 'react';

import {
  CarOutlined,
  FileSearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  DatePicker,
  Button,
  Typography,
  Tabs,
  Spin,
  Alert,
  Space,
  Divider
} from 'antd';

import {
  VehicleTypeChart,
  MaintenanceStatusChart,
  CostDistributionChart,
  MaintenanceTrendChart
} from './charts';
import { ReportGenerator, DateRangePicker } from './common';
import { ReportType, DataItem } from './common/ReportGenerator';
import { vehicleService } from '../services/vehicle';
import { Vehicle, VehicleType, convertServiceVehicleToFrontend } from '../types/vehicle';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 보고서용 차량 데이터 인터페이스
 */
interface ReportVehicle extends DataItem {
  id: string;
  name: string;
  status: string;
  type: string;
  lastMaintenance: string;
  mileage: number;
  healthScore: number;
  [key: string]: string | number | boolean | Date | null | undefined;
}

const VehicleReportPage: React.FC = () => {
  // 상태 변수들
  const [vehicles, setVehicles] = useState<ReportVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // VehicleType enum에서 차량 유형 목록 생성
  const vehicleTypes = Object.values(VehicleType);

  // 데이터 로드
  useEffect(() => {
    fetchVehicles();
  }, []);

  // 차량 데이터 가져오기
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleService.getVehicles();

      // API 응답을 ReportVehicle 형식으로 변환
      const formattedVehicles: ReportVehicle[] = response
        .map(vehicle => {
          const frontendVehicle = convertServiceVehicleToFrontend(vehicle);
          if (!frontendVehicle) {
            return null;
          }

          return {
            id: frontendVehicle.id,
            name: frontendVehicle.name,
            status: String(frontendVehicle.status),
            type: frontendVehicle.type ?? '미지정',
            lastMaintenance: frontendVehicle.lastMaintenanceDate
              ? frontendVehicle.lastMaintenanceDate.toLocaleDateString()
              : '정보 없음',
            mileage: frontendVehicle.mileage ?? 0,
            healthScore: frontendVehicle.healthScore
          };
        })
        .filter(Boolean) as ReportVehicle[];

      setVehicles(formattedVehicles);
    } catch (error) {
      console.error('차량 데이터 로드 실패:', error);
      // 데모 데이터 사용
      setVehicles([
        {
          id: 'V001',
          name: '트럭 A-101',
          status: '운행 중',
          type: '화물트럭',
          lastMaintenance: '2023-03-15',
          mileage: 45678,
          healthScore: 92
        },
        {
          id: 'V002',
          name: '버스 B-202',
          status: '정비 중',
          type: '버스',
          lastMaintenance: '2023-02-28',
          mileage: 78923,
          healthScore: 65
        },
        {
          id: 'V003',
          name: '밴 C-303',
          status: '운행 중',
          type: '밴',
          lastMaintenance: '2023-03-10',
          mileage: 35621,
          healthScore: 88
        },
        {
          id: 'V004',
          name: '승용차 D-404',
          status: '대기 중',
          type: '승용차',
          lastMaintenance: '2023-04-01',
          mileage: 12890,
          healthScore: 95
        },
        {
          id: 'V005',
          name: '택시 E-505',
          status: '운행 중',
          type: '택시',
          lastMaintenance: '2023-03-22',
          mileage: 56432,
          healthScore: 79
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용 데이터
  const filteredVehicles = vehicles.filter(vehicle => {
    // 차량 유형 필터링
    if (selectedVehicleTypes.length > 0 && !selectedVehicleTypes.includes(vehicle.type)) {
      return false;
    }

    // 날짜 범위 필터링은 실제 구현에서 추가될 예정
    return true;
  });

  // 보고서 생성 후 처리
  const handleReportGenerated = (filename: string, format: string) => {
    console.log(`보고서가 생성되었습니다: ${filename}.${format}`);
  };

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '차량 ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '차량명',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === '정비 중') {
          color = 'orange';
        } else if (status === '대기 중') {
          color = 'blue';
        } else if (status === '고장') {
          color = 'red';
        }
        return <span style={{ color }}>{status}</span>;
      }
    },
    {
      title: '마지막 정비일',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance'
    },
    {
      title: '주행거리 (km)',
      dataIndex: 'mileage',
      key: 'mileage',
      render: (mileage: number) => mileage.toLocaleString()
    },
    {
      title: '상태 점수',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (score: number) => {
        let color = 'green';
        if (score < 70) {
          color = 'orange';
        } else if (score < 50) {
          color = 'red';
        }
        return <span style={{ color }}>{score}%</span>;
      }
    }
  ];

  return (
    <div className="vehicle-report-page">
      <Card>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Title level={3}>
              <CarOutlined /> 차량 보고서
            </Title>
          </Col>
          <Col>
            <Space>
              <ReportGenerator
                data={filteredVehicles}
                availableTypes={[
                  ReportType.VEHICLE_STATUS,
                  ReportType.MAINTENANCE_HISTORY,
                  ReportType.FLEET_SUMMARY
                ]}
                filenamePrefix="vehicle-report"
                buttonText="보고서 생성"
                onReportGenerated={handleReportGenerated}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchVehicles} loading={loading}>
                새로고침
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title={
                <>
                  <FilterOutlined /> 필터
                </>
              }
              size="small"
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>차량 유형</Text>
                  <Select
                    mode="multiple"
                    placeholder="차량 유형 선택"
                    style={{ width: '100%', marginTop: 8 }}
                    value={selectedVehicleTypes}
                    onChange={setSelectedVehicleTypes}
                  >
                    {vehicleTypes.map(type => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Text strong>날짜 범위</Text>
                  <br />
                  <DatePicker.RangePicker
                    style={{ width: '100%', marginTop: 8 }}
                    onChange={dates => {
                      if (dates) {
                        setDateRange([
                          dates[0]?.toDate() ?? new Date(),
                          dates[1]?.toDate() ?? new Date()
                        ]);
                      } else {
                        setDateRange(null);
                      }
                    }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Tabs defaultActiveKey="vehicle-status" type="card">
          <TabPane
            tab={
              <>
                <CarOutlined /> 차량 상태
              </>
            }
            key="vehicle-status"
          >
            <Spin spinning={loading}>
              {filteredVehicles.length > 0 ? (
                <Table
                  dataSource={filteredVehicles}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <Alert
                  message="데이터 없음"
                  description="표시할 차량 데이터가 없습니다. 필터 조건을 변경하거나 다시 시도해주세요."
                  type="info"
                />
              )}
            </Spin>
          </TabPane>

          <TabPane
            tab={
              <>
                <DashboardOutlined /> 요약 대시보드
              </>
            }
            key="dashboard"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card title="차량 유형 분포">
                  {filteredVehicles.length > 0 ? (
                    <VehicleTypeChart
                      data={Object.entries(
                        filteredVehicles.reduce(
                          (acc, vehicle) => {
                            acc[vehicle.type] = (acc[vehicle.type] ?? 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        )
                      ).map(([label, value]) => ({
                        label,
                        value
                      }))}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text type="secondary">데이터가 없습니다</Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="차량 상태 분포">
                  {filteredVehicles.length > 0 ? (
                    <MaintenanceStatusChart
                      data={Object.entries(
                        filteredVehicles.reduce(
                          (acc, vehicle) => {
                            acc[vehicle.status] = (acc[vehicle.status] ?? 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        )
                      ).map(([label, value]) => ({
                        label,
                        value
                      }))}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text type="secondary">데이터가 없습니다</Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="상태 점수 분포">
                  {filteredVehicles.length > 0 ? (
                    <CostDistributionChart
                      data={[
                        {
                          label: '양호 (80-100)',
                          value: filteredVehicles.filter(v => v.healthScore >= 80).length
                        },
                        {
                          label: '주의 (50-79)',
                          value: filteredVehicles.filter(
                            v => v.healthScore >= 50 && v.healthScore < 80
                          ).length
                        },
                        {
                          label: '위험 (0-49)',
                          value: filteredVehicles.filter(v => v.healthScore < 50).length
                        }
                      ]}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text type="secondary">데이터가 없습니다</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="차량 상태 점수 통계">
                  {filteredVehicles.length > 0 ? (
                    <MaintenanceTrendChart
                      data={filteredVehicles.map(vehicle => ({
                        date: vehicle.lastMaintenance,
                        completed: 1,
                        pending: vehicle.healthScore < 70 ? 1 : 0
                      }))}
                    />
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text type="secondary">데이터가 없습니다</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <>
                <FileSearchOutlined /> 상세 분석
              </>
            }
            key="analysis"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="기능 준비 중"
                  description="상세 분석 기능은 현재 개발 중입니다. 곧 이용하실 수 있습니다."
                  type="info"
                  showIcon
                />
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default VehicleReportPage;
