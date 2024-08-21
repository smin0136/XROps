using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Microsoft.MixedReality.Toolkit;
using Microsoft.MixedReality.Toolkit.Input;

public class GlobalInputListener : MonoBehaviour, IMixedRealityInputHandler
{
    private void OnEnable()
    {
        // 리스너를 입력 시스템에 등록
        CoreServices.InputSystem?.RegisterHandler<IMixedRealityInputHandler>(this);
    }

    private void OnDisable()
    {
        // 입력 시스템에서 리스너를 해제
        CoreServices.InputSystem?.UnregisterHandler<IMixedRealityInputHandler>(this);
    }

    public void OnInputDown(InputEventData eventData)
    {
        // Air Tap에 해당하는 액션 ID를 확인
        //if (eventData.MixedRealityInputAction == MixedRealityInputAction.Get(TouchScreenInputSourceType.Touch))
        //{
            // Air Tap 감지됨
        //    Debug.Log("Air Tap Detected");
        //}
    }

    public void OnInputUp(InputEventData eventData)
    {
        // 이 메서드는 예제에서는 사용되지 않지만, 필요에 따라 구현할 수 있음
    }
}
