import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Tab = 'terms' | 'privacy';

export default function TermsPrivacyScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState<Tab>('terms');

  useEffect(() => {
    if (tab === 'privacy') {
      setSelectedTab('privacy');
    } else {
      setSelectedTab('terms');
    }
  }, [tab]);

  const handleBackPress = () => {
    router.back();
  };

  const renderTabButton = (tab: Tab, title: string) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.activeTabButton]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text
        style={[
          styles.tabButtonText,
          selectedTab === tab && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 상단 네비게이션 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>약관 및 정책</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 탭 버튼 */}
      <View style={styles.tabContainer}>
        {renderTabButton('terms', '이용약관')}
        {renderTabButton('privacy', '개인정보 처리방침')}
      </View>
      {/* 내용 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'terms' ? <TermsOfUseView /> : <PrivacyPolicyView />}
      </ScrollView>
    </View>
  );
}

// 이용약관 컴포넌트
function TermsOfUseView() {
  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <View style={styles.scrollContent}>
      <Text style={styles.mainTitle}>이용약관</Text>

      {renderSection(
        '제1조 (목적)',
        '본 약관은 Teaming(이하 "서비스")의 이용과 관련하여, 회사와 이용자 간 권리‧의무 및 책임 사항, 서비스 이용조건과 절차, 예치금(보증금) 운영 원칙 등을 정함을 목적으로 합니다.'
      )}

      {renderSection(
        '제2조 (정의)',
        '"서비스"란 팀 프로젝트(이하 "팀플")의 효율적 수행을 지원하기 위해 팀 채팅방 개설, 진행 관리, 예치금 운영, 완료 인증 및 페널티 집행 등 기능을 제공하는 Teaming을 말합니다.\n\n"팀룸"이란 서비스 내에서 팀플을 위해 개설되는 공간(채팅방·보드 등)을 말합니다.\n\n"예치금(보증금)"이란 팀룸 참여자가 팀플 완주 의지를 담보하기 위해 인원수 기준으로 납부하는 금액을 말합니다.\n\n"완주"란 팀룸 개설 시 설정된 기간·목표·산출물 등 완료 기준에 따라 서비스 내 완료 인증 절차(예: 전원 확인, 리더 승인, 제출물 업로드 등)를 거쳐 회사가 시스템상 완료 상태로 처리한 것을 말합니다.\n\n"페널티"란 미완주자 등에 대해 예치금을 활용해 기프티콘 등 디지털 상품을 구매하도록 하는 조치 및 그 집행 절차를 말합니다.'
      )}

      {renderSection(
        '제3조 (약관의 효력 및 변경)',
        '본 약관은 앱/웹 화면 게시 또는 기타 방법으로 공지함으로써 효력이 발생합니다.\n\n회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 최소 7일(이용자에게 불리하거나 중대한 변경은 30일) 전에 공지합니다.'
      )}

      {renderSection(
        '제4조 (이용계약의 성립 및 계정)',
        '서비스는 만 14세 이상의 개인이 가입할 수 있습니다.\n\n이용계약은 이용자가 약관에 동의하고, 회사가 정한 절차에 따라 가입을 승인함으로써 성립합니다.\n\n이용자는 계정 정보(이메일, 이름, 프로필 사진 등)를 정확하게 제공해야 하며, 허위 정보 제공으로 인한 책임은 이용자에게 있습니다.'
      )}

      {renderSection(
        '제5조 (서비스 내용)',
        '팀룸 개설 및 참여, 팀 채팅/알림, 일정·산출물 관리, 완주 인증, 예치금 납부/환급, 페널티 집행 기능 등을 제공합니다.\n\n회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다. 중대한 변경의 경우 사전 공지합니다.'
      )}

      {renderSection(
        '제6조 (예치금(보증금) 납부)',
        '팀룸 개설자는 인원수 기준 예치금 단가, 목표, 기간, 완료 기준 등을 설정할 수 있으며, 참여자는 입장 시 예치금을 결제합니다.\n\n결제는 회사가 지정한 전자결제수단(결제대행사(PG) 등)을 통해 처리되며, 회사는 카드번호 등 민감한 결제정보를 직접 보관하지 않습니다.\n\n회사는 예치금에 대해 별도 고지된 범위 내에서 서비스 이용수수료 및 PG 수수료를 공제할 수 있습니다.'
      )}

      {renderSection(
        '제7조 (완주 인증 및 환급)',
        '팀플이 완료 기준을 충족하여 완주 인증이 이루어지면, 회사는 각 참여자 예치금에서 수수료 등을 제외한 금액을 환급합니다.\n\n환급 시기, 방법, 소요 기간은 결제수단 및 PG사 정책, 금융기관 상황 등에 따라 달라질 수 있으며, 서비스 화면에 안내합니다.\n\n완료 기준 및 인증 절차는 팀룸 설정 시 확정되며, 진행 중 변경 시 참여자에게 고지합니다.'
      )}

      {renderSection(
        '제8조 (미완주, 이탈 및 페널티)',
        '아래 각 호에 해당하는 경우, 해당 참여자의 예치금 전부 또는 일부가 페널티 재원으로 전환될 수 있습니다.\n• 팀룸 설정 기간 내 완료 기준 미충족\n• 중도 이탈/장기 미참여 등 팀룸 설정상 불이익 사유 발생\n• 허위 인증, 부정행위 등 공정성 저해\n\n페널티 재원은 서비스 내 정책에 따라 기프티콘 등 디지털 상품 구매에 사용되며, 분배 기준(예: 성실 참여자 보상 등)은 팀룸 설정 또는 서비스 정책에 따릅니다.\n\n페널티로 전환된 예치금 및 이미 구매된 디지털 상품은 원칙적으로 환불되지 않습니다.'
      )}

      {renderSection(
        '제9조 (수수료 및 비용)',
        '회사는 서비스 제공에 대한 이용수수료를 부과할 수 있으며, 구체적 내용은 서비스 화면에 고지합니다.\n\n결제/환급 과정에서 발생하는 PG 수수료·금융비용 등은 정책에 따라 공제될 수 있습니다.'
      )}

      {renderSection(
        '제10조 (이용자 의무)',
        '이용자는 다음 행위를 해서는 안 됩니다.\n• 타인의 계정 사용, 개인정보 도용\n• 허위 완료 인증, 출석/성과의 조작, 담합\n• 욕설·모욕·차별·혐오 표현, 불법정보 유통\n• 서비스 장애 유발, 리버스 엔지니어링 등 기술적 침해\n• 저작권·상표권 등 제3자 권리 침해'
      )}

      {renderSection(
        '제11조 (콘텐츠 권리)',
        '이용자가 서비스에 게시·전송하는 자료의 저작권은 원칙적으로 이용자에게 귀속됩니다.\n\n이용자는 서비스 운영·개선·홍보를 위해 회사가 해당 자료를 비독점적으로 이용(저장·복제·전송·편집 등)할 수 있는 범위 내 사용권을 회사에 부여합니다.'
      )}

      {renderSection(
        '제12조 (서비스의 중단)',
        '시스템 점검·장애, 천재지변 등 불가피한 사유가 있는 경우 서비스 제공이 일시 중단될 수 있습니다.\n\n회사는 긴급 상황을 제외하고 사전 공지에 노력합니다.'
      )}

      {renderSection(
        '제13조 (계약 해지 및 이용제한)',
        '이용자는 언제든지 회원 탈퇴를 신청할 수 있습니다.\n\n이용자가 본 약관을 위반하거나 서비스 질서를 심각하게 해치는 경우, 회사는 경고·일시정지·영구이용정지 등 필요한 조치를 할 수 있습니다.\n\n이용정지 시 이미 발생한 페널티 전환·수수료 부과 등은 유효합니다.'
      )}

      {renderSection(
        '제14조 (면책)',
        '회사는 다음 사유로 발생한 손해에 대해 책임을 지지 않습니다.\n• 이용자의 귀책(정보오류, 규칙 위반 등)\n• 통신장애·PG사·금융기관 사유 등 회사가 통제 불가능한 사유\n• 팀플의 내용·수준·완료 기준 적정성에 관한 분쟁\n\n단, 회사의 고의 또는 중과실이 입증된 경우에는 그러하지 않습니다.'
      )}

      {renderSection(
        '제15조 (분쟁처리 및 관할)',
        '서비스 이용과 관련한 문의·이의제기는 고객센터를 통해 접수합니다.\n\n본 약관은 대한민국 법률에 따르며, 분쟁이 소송으로 이어질 경우 서울중앙지방법원을 전속 관할로 합니다.'
      )}

      {renderSection(
        '제16조 (약관의 해석)',
        '약관에 명시되지 않은 사항은 관련 법령 또는 일반적인 상관례를 따릅니다.'
      )}
    </View>
  );
}

// 개인정보 처리방침 컴포넌트
function PrivacyPolicyView() {
  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <View style={styles.scrollContent}>
      <Text style={styles.mainTitle}>개인정보 처리방침</Text>

      {renderSection(
        '제1조 (수집하는 개인정보 항목)',
        '회원 가입/로그인: 이메일, 이름, 프로필 사진(소셜 로그인 시 제공 범위 내)\n\n서비스 이용 중 생성정보: 팀룸 정보(참여 기록, 역할, 진행상태), 메시지 메타데이터(전송시각 등), 알림 수신 기록, 접속 기록(IP, 기기·OS 식별자, 앱 버전)\n\n결제/환급 관련: 예치금 결제 및 환급 내역, 거래 식별값(주문/거래 ID 등)\n\n회사는 카드번호 등 민감한 결제정보를 직접 수집·보관하지 않으며, 결제 대행사는 관련 법령에 따라 정보를 처리합니다.\n\n고객문의/분쟁처리: 문의 내용, 첨부 자료, 처리 기록\n\n선택항목(사용자가 입력한 경우): 소속(대학/회사명), 학과/직무, 프로필 소개 등'
      )}

      {renderSection(
        '제2조 (수집 방법)',
        '앱/웹 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력하거나, 서비스 이용 중 자동으로 생성·수집됩니다. 결제정보는 결제대행사(PG)를 통해 수집됩니다.'
      )}

      {renderSection(
        '제3조 (개인정보의 이용 목적)',
        '• 회원 식별, 계정 관리, 부정이용 방지\n• 팀룸 운영(참여/진행/완주 인증 등) 및 알림 제공\n• 예치금 결제·환급 처리, 페널티 집행(디지털 상품 구매 등)\n• 고객지원, 민원·분쟁 처리, 공지사항 전달\n• 서비스 품질 향상, 이용통계·로그 분석(개인 식별 불가 형태의 통계화 포함)\n• 법령상 의무 이행(회계·세무, 보관의무 등)'
      )}

      {renderSection(
        '제4조 (처리 및 보유 기간)',
        '회원정보: 회원 탈퇴 시 지체없이 파기. 단, 부정이용 방지 등을 위해 탈퇴 후 최대 30일간 최소정보를 보관할 수 있음.\n\n거래기록(결제/환급 포함): 전자상거래 등에서의 소비자보호에 관한 법률에 따라 5년 보관\n\n소비자 불만·분쟁처리 기록: 3년 보관\n\n접속 로그 등 서비스 이용기록: 통신비밀보호 관련 기준에 따라 3개월 이상 보관'
      )}

      {renderSection(
        '제5조 (개인정보의 제3자 제공)',
        '회사는 원칙적으로 이용자 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 다음의 경우 제공할 수 있습니다.\n• 이용자가 사전에 동의한 경우\n• 법령에 따라 요구되는 경우\n• 서비스 제공에 필수적인 범위에서\n  - 결제대행사(PG): 결제·환급 처리(거래 식별값, 금액 등)\n  - 디지털 상품(기프티콘) 공급사: 상품 구매·전송에 필요한 최소 정보(수령 수단 등)'
      )}

      {renderSection(
        '제6조 (개인정보 처리의 위탁)',
        '회사는 안정적 서비스 제공을 위해 아래 업무를 위탁할 수 있습니다.\n• 클라우드 인프라/백업\n• 푸시 알림/메시징\n• 결제/환급 처리: [PG사명 기재]\n• 고객지원 시스템\n\n※ 위탁 계약 시 개인정보 보호 조치를 명시하며, 수탁자·업무 내용 변경 시 본 방침에 고지합니다.'
      )}

      {renderSection(
        '제7조 (정보주체의 권리)',
        '이용자는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지, 동의철회를 요청할 수 있습니다. 앱 내 메뉴(마이페이지 등) 또는 고객센터로 신청하세요.\n\n단, 법령상 보존이 필요한 정보는 삭제가 제한될 수 있습니다.'
      )}

      {renderSection(
        '제8조 (아동의 개인정보)',
        '회사는 원칙적으로 만 14세 미만 아동의 회원가입을 허용하지 않습니다.'
      )}

      {renderSection(
        '제9조 (개인정보의 파기 절차 및 방법)',
        '보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.\n\n전자파일: 복구 불가능한 방법으로 영구 삭제\n출력물: 분쇄 또는 소각'
      )}

      {renderSection(
        '제10조 (안전성 확보 조치)',
        '접근권한 관리, 암호화(전송구간/민감정보), 접근기록 보관/점검, 침입 차단/탐지, 물리적 보안 등 법령에 따른 기술적·관리적 보호조치를 시행합니다.'
      )}

      {renderSection(
        '제11조 (개인정보 보호책임자)',
        '성명: [성명]\n직책: [직책]\n연락처: [전화번호], [이메일]\n\n※ 개인정보 관련 문의·불만처리·피해구제 등을 신속히 처리하겠습니다.'
      )}

      {renderSection(
        '제12조 (고지의 의무)',
        '법령·정책 또는 서비스 변경에 따라 본 방침이 변경되는 경우, 시행 7일 전(중대한 사항은 30일 전) 서비스 내 공지합니다.'
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#4A90E2',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#292929',
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionContent: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 22,
  },
});
