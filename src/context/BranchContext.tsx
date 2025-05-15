import React, { createContext, useContext, useState, useEffect } from "react";
import { getBranchList, getBranchDetail } from "../services/api";
import { LS_KEYS } from "../services/api";

// 브랜치 정보 인터페이스
export interface Branch {
  id: number | string;
  name: string;
}

// 브랜치 상세 정보 인터페이스
export interface BranchDetail {
  id: number | string;
  name: string;
  adress?: string;
  dial_numbers?: string;
  basic_cost?: string | number;
  weekly_allowance?: boolean;
  images?: string;
  contents?: string;
  openingHour?: string;
  closingHour?: string;
}

// Context에 제공할 값들의 인터페이스
interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  branchDetail: BranchDetail | null;
  selectedBranchId: number | string | null;
  setSelectedBranchId: (id: number | string) => void;
  isLoading: boolean;
  error: string | null;
}

// 기본값으로 사용할 context 생성
const BranchContext = createContext<BranchContextType | undefined>(undefined);

// Provider 컴포넌트
export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [branchDetail, setBranchDetail] = useState<BranchDetail | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<
    number | string | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 브랜치 목록 로드
  useEffect(() => {
    const loadBranches = async () => {
      setIsLoading(true);
      try {
        // 인증 토큰이 있는 경우에만 API 호출
        if (localStorage.getItem(LS_KEYS.AUTH_TOKEN)) {
          console.log("브랜치 목록 가져오기 API 호출 시작");
          const data = await getBranchList();
          console.log("서버에서 가져온 브랜치 목록:", data);

          if (data && Array.isArray(data) && data.length > 0) {
            console.log("유효한 브랜치 데이터 수신:", data.length, "개 항목");
            setBranches(data);

            // 첫 번째 브랜치를 기본 선택
            if (!selectedBranchId) {
              const firstId = data[0].id;
              console.log(`첫 번째 브랜치 ID ${firstId} 선택`);
              setSelectedBranchId(firstId);
            }
          } else {
            console.warn("가져온 브랜치 목록이 비어있거나 유효하지 않습니다");
            setBranches([]);
          }
        } else {
          console.warn("인증 토큰이 없어 브랜치 목록을 가져올 수 없습니다");
        }
      } catch (err) {
        console.error("브랜치 목록을 불러오는 중 오류가 발생했습니다:", err);
        setError("브랜치 목록을 불러오는 중 오류가 발생했습니다.");
        setBranches([]);
      } finally {
        console.log("브랜치 목록 로딩 완료, isLoading = false 설정");
        setIsLoading(false);
      }
    };

    loadBranches();
  }, []);

  // 선택된 브랜치 ID가 변경될 때 상세 정보 로드
  useEffect(() => {
    if (!selectedBranchId) return;

    const loadBranchDetail = async () => {
      setIsLoading(true);
      try {
        // 현재 브랜치 객체 설정
        const branch = branches.find((b) => b.id === selectedBranchId) || null;
        console.log(
          `브랜치 ID ${selectedBranchId}에 대한 상세 정보 로드 중`,
          branch
        );
        setCurrentBranch(branch);

        // 브랜치 상세 정보 로드
        const detail = await getBranchDetail(selectedBranchId);
        console.log(
          `서버에서 가져온 브랜치 ID ${selectedBranchId}의 상세 정보:`,
          detail
        );

        if (!detail) {
          console.warn(
            `브랜치 ID ${selectedBranchId}에 대한 상세 정보가 없습니다`
          );
          setBranchDetail(null);
          setIsLoading(false);
          return;
        }

        // 운영 시간 파싱 (contents 필드에 "08:00 - 22:00" 형식으로 저장됐다고 가정)
        let openingHour = "09:00";
        let closingHour = "22:00";

        if (detail?.contents) {
          try {
            const timeMatch = detail.contents.match(
              /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
            );
            if (timeMatch && timeMatch.length >= 3) {
              openingHour = timeMatch[1];
              closingHour = timeMatch[2];
              console.log(
                `운영 시간 파싱 결과: ${openingHour} - ${closingHour}`
              );
            } else {
              console.log(
                `운영 시간 파싱 실패. 원본 데이터: ${detail.contents}`
              );
            }
          } catch (e) {
            console.warn("운영 시간 파싱 오류:", e);
          }
        } else {
          console.log("운영 시간 정보(contents)가 없습니다");
        }

        // 완성된 브랜치 상세 정보 설정
        const completeDetail = {
          ...detail,
          id: selectedBranchId,
          name: branch?.name || detail?.name || "",
          openingHour,
          closingHour,
        };

        console.log("최종 브랜치 상세 정보:", completeDetail);
        setBranchDetail(completeDetail);
      } catch (err) {
        console.error(
          `브랜치 ID ${selectedBranchId} 상세 정보를 불러오는 중 오류:`,
          err
        );
        setError("브랜치 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadBranchDetail();
  }, [selectedBranchId, branches]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        branchDetail,
        selectedBranchId,
        setSelectedBranchId,
        isLoading,
        error,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

// Context 사용을 위한 커스텀 훅
export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};
