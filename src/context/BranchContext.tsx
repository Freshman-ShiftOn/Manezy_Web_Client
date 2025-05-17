import React, { createContext, useContext, useState, useEffect } from "react";
import { getBranchList, getBranchDetail } from "../services/api";
import { LS_KEYS } from "../services/api";

// 브랜치 정보 인터페이스
export interface Branch {
  id: string; // ID를 항상 문자열로 통일
  name: string;
}

// 브랜치 상세 정보 인터페이스
export interface BranchDetail extends Branch {
  adress: string;
  dial_numbers: string;
  basic_cost: string;
  weekly_allowance: boolean;
  images?: string;
  contents?: string;
  openingHour: string;
  closingHour: string;
}

// Context에 제공할 값들의 인터페이스
interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  branchDetail: BranchDetail | null;
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refreshBranches: () => Promise<void>;
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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 브랜치 목록 로드 함수 - 외부에서 직접 호출할 수 있도록 분리
  const loadBranches = async () => {
    setIsLoading(true);
    setError(null);
    console.group("BranchContext - 브랜치 목록 로드");
    console.log("브랜치 로드 시작");

    try {
      const authToken = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
      // 인증 토큰이 있는 경우에만 API 호출
      if (authToken) {
        console.log("인증 토큰 확인:", authToken.substring(0, 10) + "...");
        console.log("브랜치 목록 가져오기 API 호출 시작");
        const data = await getBranchList();
        console.log("서버에서 가져온 브랜치 목록:", data);

        if (data && Array.isArray(data)) {
          console.log("유효한 브랜치 데이터 수신:", data.length, "개 항목");
          // ID를 문자열로 변환하여 저장 (일관성 유지)
          const normalizedData = data.map((branch) => ({
            ...branch,
            id: String(branch.id), // ID를 항상 문자열로 통일
          }));
          console.log("정규화된 브랜치 데이터:", normalizedData);
          setBranches(normalizedData);

          // 첫 번째 브랜치를 기본 선택
          if (!selectedBranchId && normalizedData.length > 0) {
            const firstId = normalizedData[0].id;
            console.log(`첫 번째 브랜치 ID ${firstId} 선택`);
            setSelectedBranchId(firstId);
          }
        } else {
          console.warn(
            "가져온 브랜치 목록이 비어있거나 유효하지 않습니다:",
            data
          );
          setBranches([]);
        }
      } else {
        console.warn("인증 토큰이 없어 브랜치 목록을 가져올 수 없습니다");
        setBranches([]);
        setError("인증이 필요합니다. 다시 로그인해주세요.");
      }
    } catch (err) {
      console.error("브랜치 목록을 불러오는 중 오류가 발생했습니다:", err);
      setError(
        err instanceof Error
          ? err.message
          : "브랜치 목록을 불러오는 중 오류가 발생했습니다."
      );
      setBranches([]);
    } finally {
      console.log("브랜치 목록 로딩 완료, isLoading = false 설정");
      setIsLoading(false);
      console.groupEnd();
    }
  };

  // 컴포넌트 마운트 시 브랜치 목록 로드
  useEffect(() => {
    loadBranches();
  }, []);

  // 선택된 브랜치 ID가 변경될 때 상세 정보 로드
  useEffect(() => {
    if (!selectedBranchId) return;

    console.group("BranchContext - 브랜치 상세 정보 로드");
    console.log(
      "선택된 브랜치 ID:",
      selectedBranchId,
      "타입:",
      typeof selectedBranchId
    );
    console.log("현재 브랜치 목록:", branches);

    const loadBranchDetail = async () => {
      setIsLoading(true);
      try {
        // 현재 브랜치 객체 설정
        const branch = branches.find((b) => b.id === selectedBranchId) || null;
        console.log(
          `브랜치 ID ${selectedBranchId}에 대한 상세 정보 로드 중, 찾은 브랜치:`,
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
          console.groupEnd();
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

        // ID를 문자열로 통일하여 완성된 브랜치 상세 정보 설정
        const completeDetail = {
          ...detail,
          id: String(selectedBranchId), // ID를 항상 문자열로 통일
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
        console.groupEnd();
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
        refreshBranches: loadBranches,
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
