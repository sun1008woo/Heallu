import { Modal, View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { WorkoutRoutine } from "@/lib/routine-diet-types";
import {
  createShareLink,
  exportRoutineAsJSON,
  getSharedRoutines,
} from "@/lib/routine-sharing-storage";
// Clipboard 기능은 시스템 공유로 대체
import { Ionicons } from "@expo/vector-icons";

interface RoutineShareModalProps {
  visible: boolean;
  routine: WorkoutRoutine | null;
  creatorName: string;
  onClose: () => void;
  onImport?: (routine: WorkoutRoutine) => void;
}

export function RoutineShareModal({
  visible,
  routine,
  creatorName,
  onClose,
  onImport,
}: RoutineShareModalProps) {
  const colors = useColors();
  const [shareCode, setShareCode] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [exportJson, setExportJson] = useState<string>("");

  useEffect(() => {
    if (visible && routine) {
      generateShareLink();
    }
  }, [visible, routine]);

  const generateShareLink = async () => {
    if (!routine) return;

    setLoading(true);
    try {
      const link = await createShareLink(routine, creatorName);
      setShareCode(link.shortCode);
      setShareUrl(link.fullUrl);

      // 익스포트 JSON도 생성
      const json = exportRoutineAsJSON(routine, creatorName);
      setExportJson(json);
    } catch (error) {
      console.error("Failed to generate share link:", error);
      Alert.alert("오류", "공유 링크 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    // 실제 구현에서는 react-native-clipboard 또는 다른 라이브러리 사용
    Alert.alert("공유 코드", text);
  };

  const shareViaSystem = async () => {
    if (!shareUrl) return;

    try {
      // React Native Sharing API 사용 (Expo에서 제공)
      const { Share } = await import("react-native");
      await Share.share({
        message: `내 운동 루틴을 공유합니다: ${routine?.name}\n\n${shareUrl}`,
        title: "운동 루틴 공유",
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <ScreenContainer className="bg-black/50">
        <View className="flex-1 justify-end">
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.background }}
          >
            {/* 헤더 */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-foreground">
                루틴 공유
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 공유 코드 섹션 */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-foreground mb-3">
                  공유 코드
                </Text>
                <View
                  className="p-4 rounded-lg border-2"
                  style={{
                    borderColor: colors.primary,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text
                    className="text-2xl font-bold text-center"
                    style={{ color: colors.primary }}
                  >
                    {shareCode || "생성 중..."}
                  </Text>
                  <TouchableOpacity
                    className="mt-3 py-2 px-4 rounded-lg"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => copyToClipboard(shareCode)}
                  >
                    <Text className="text-center text-white font-semibold">
                      코드 복사
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 공유 URL 섹션 */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-foreground mb-3">
                  공유 링크
                </Text>
                <View
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: colors.surface }}
                >
                  <TextInput
                    value={shareUrl}
                    editable={false}
                    multiline
                    className="text-sm text-muted mb-3"
                    style={{ color: colors.muted }}
                  />
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 py-2 px-3 rounded-lg"
                      style={{ backgroundColor: colors.primary }}
                      onPress={() => copyToClipboard(shareUrl)}
                    >
                      <Text className="text-center text-white font-semibold text-sm">
                        링크 복사
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 py-2 px-3 rounded-lg border-2"
                      style={{ borderColor: colors.primary }}
                      onPress={shareViaSystem}
                    >
                      <Text
                        className="text-center font-semibold text-sm"
                        style={{ color: colors.primary }}
                      >
                        공유
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 익스포트 섹션 */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-foreground mb-3">
                  JSON 익스포트
                </Text>
                <TouchableOpacity
                  className="py-3 px-4 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => copyToClipboard(exportJson)}
                >
                  <Text className="text-center text-white font-semibold">
                    JSON 복사
                  </Text>
                </TouchableOpacity>
                <Text className="text-xs text-muted mt-2">
                  JSON 데이터를 복사하여 다른 기기에서 임포트할 수 있습니다.
                </Text>
              </View>

              {/* 닫기 버튼 */}
              <TouchableOpacity
                className="py-3 px-4 rounded-lg mb-4"
                style={{ backgroundColor: colors.surface }}
                onPress={onClose}
              >
                <Text className="text-center text-foreground font-semibold">
                  닫기
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </ScreenContainer>
    </Modal>
  );
}
